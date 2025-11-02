/** @format */

'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';
import type { components } from '@/lib/types/openapi';
import { decodeJwtPayload } from './token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/accounts/';

type Position = components['schemas']['Position'];
type UserDetail = components['schemas']['UserList'];
type AvailabilityOut = components['schemas']['AvailabilityOut'];
type CompanyCodeResponse = components['schemas']['CompanyCode'];

// Typ dla odpowiedzi z paginacją
type PaginatedResponse<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};

function resolveApiUrl(endpoint: string | URL): string {
	if (endpoint instanceof URL) {
		return endpoint.toString();
	}
	if (/^https?:\/\//i.test(endpoint)) {
		return endpoint;
	}
	if (!API_BASE_URL) {
		throw new Error('API base URL is not defined');
	}
	return new URL(endpoint, API_BASE_URL).toString();
}

// Funkcja odświeżająca token
async function refreshToken(
	refreshToken: string
): Promise<{ access: string; refresh?: string } | null> {
	try {
		console.log('🔄 Attempting to refresh access token...');
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/accounts/token/refresh`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh: refreshToken }),
			}
		);

		if (!response.ok) {
			console.error(
				'❌ Failed to refresh token:',
				response.status,
				response.statusText
			);
			const errorText = await response.text();
			console.error('Response body:', errorText);
			return null;
		}

		const data = await response.json();
		console.log('✅ Token refreshed successfully');
		return data;
	} catch (error) {
		console.error('❌ Error during token refresh:', error);
		return null;
	}
}

async function getAccessToken(): Promise<string> {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No access token in session');
	}

	// Sprawdź czy token nie wygasł
	try {
		const decoded = decodeJwtPayload(session.user.accessToken);
		const expiresAt = decoded.exp * 1000;
		const now = Date.now();
		const timeUntilExpiry = expiresAt - now;

		console.log(
			`🔑 Token expires in ${Math.round(timeUntilExpiry / 1000)}s`
		);

		// Jeśli token wygasa za mniej niż 5 minut, odśwież go
		if (timeUntilExpiry < 5 * 60 * 1000) {
			console.log('⚠️ Token expires soon, refreshing...');
			if (session.user.refreshToken) {
				const newTokens = await refreshToken(session.user.refreshToken);
				if (newTokens) {
					// Zaktualizuj sesję - to powinno wywołać jwt callback
					// Ale nie mamy bezpośredniego dostępu do update w server actions
					console.log(
						'✅ Got new tokens, but cannot update session from server action'
					);
					return newTokens.access;
				}
			}
		}
	} catch (error) {
		console.error('❌ Error decoding token:', error);
	}

	return session.user.accessToken;
}

async function authorizedFetch(
	endpoint: string | URL,
	init: RequestInit = {},
	retryCount = 0
): Promise<Response> {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No session or access token');
	}

	const headers = new Headers(init.headers);

	if (!headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${session.user.accessToken}`);
	}

	if (init.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(resolveApiUrl(endpoint), {
		...init,
		headers,
	});
	if (response.status === 401 && retryCount === 0) {
		console.log('🔄 Got 401, attempting to refresh token and retry...');

		if (session.user.refreshToken) {
			const newTokens = await refreshToken(session.user.refreshToken);

			if (newTokens) {
				console.log('✅ Token refreshed, retrying request...');
				headers.set('Authorization', `Bearer ${newTokens.access}`);

				return fetch(resolveApiUrl(endpoint), {
					...init,
					headers,
				});
			} else {
				console.error('❌ Failed to refresh token, session expired');
			}
		} else {
			console.error('❌ No refresh token available');
		}
	}

	return response;
}

async function apiRequest<T>(
	endpoint: string | URL,
	init: RequestInit,
	errorMessage: string
): Promise<T> {
	const response = await authorizedFetch(endpoint, init);

	if (!response.ok) {
		console.error(`${errorMessage}:`, response.status, response.statusText);
		try {
			const errorText = await response.text();
			console.error('Response body:', errorText);
		} catch (error) {
			console.error('Could not read response body', error);
		}
		throw new Error(
			`${errorMessage}: ${response.status} ${response.statusText}`
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		await signIn('credentials', {
			email: formData.get('email'),
			password: formData.get('password'),
			redirectTo: '/dashboard', // NextAuth v5 uses redirectTo
		});
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case 'CredentialsSignin':
					return 'Invalid credentials.';
				default:
					return 'Something went wrong.';
			}
		}
		throw error;
	}
}

export async function signOutUser() {
	await signOut({
		redirect: true,
		redirectTo: '/',
	});
}

export async function fetchEmployees(search?: string): Promise<UserDetail[]> {
	const url = new URL('employees/', API_BASE_URL);
	if (search) {
		url.searchParams.set('search', search);
	}
	return apiRequest<UserDetail[]>(
		url,
		{ method: 'GET' },
		'Failed to fetch employees'
	);
}

export async function fetchPositions(): Promise<Position[]> {
	return apiRequest<Position[]>(
		'positions/',
		{ method: 'GET' },
		'Failed to fetch positions'
	);
}

export async function createPosition(name: string): Promise<Position> {
	return apiRequest<Position>(
		'positions/',
		{ method: 'POST', body: JSON.stringify({ name }) },
		'Failed to create position'
	);
}

export async function updatePosition(
	id: number,
	name: string
): Promise<Position> {
	return apiRequest<Position>(
		`positions/${id}/`,
		{ method: 'PUT', body: JSON.stringify({ name }) },
		'Failed to update position'
	);
}

export async function deletePosition(id: number) {
	const response = await authorizedFetch(`positions/${id}/`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		console.error(
			'Failed to delete position:',
			response.status,
			response.statusText
		);
		try {
			const errorText = await response.text();
			console.error('Response body:', errorText);
		} catch (error) {
			console.error('Could not read response body', error);
		}
		throw new Error('Failed to delete position');
	}

	return true;
}

export async function fetchCompanyCode(): Promise<CompanyCodeResponse> {
	return apiRequest<CompanyCodeResponse>(
		'companycode/',
		{ method: 'GET' },
		'Failed to fetch company code'
	);
}

export async function generateCompanyCode(): Promise<CompanyCodeResponse> {
	return apiRequest<CompanyCodeResponse>(
		'companycode/reset/',
		{ method: 'POST' },
		'Failed to generate company code'
	);
}

export async function resetCompanyCode(): Promise<CompanyCodeResponse> {
	return apiRequest<CompanyCodeResponse>(
		'company/reset-code/',
		{ method: 'POST' },
		'Failed to reset company code'
	);
}

export async function fetchAvailability(params?: {
	employee_id?: string;
	date_from?: string;
	date_to?: string;
	only_with_slots?: boolean;
	limit?: number;
	offset?: number;
}): Promise<AvailabilityOut[]> {
	// Używamy pełnego URL, ponieważ schedule jest pod inną ścieżką niż accounts
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const fullUrl = `${baseUrl}/schedule/availability`;
	const url = new URL(fullUrl);

	// Backend FastAPI wymaga WSZYSTKICH parametrów, więc podajemy wartości domyślne
	url.searchParams.set('employee_id', params?.employee_id || '');
	url.searchParams.set('date_from', params?.date_from || '');
	url.searchParams.set('date_to', params?.date_to || '');
	url.searchParams.set(
		'only_with_slots',
		String(params?.only_with_slots ?? false)
	);
	url.searchParams.set('limit', String(params?.limit ?? 100));
	url.searchParams.set('offset', String(params?.offset ?? 0));

	const response = await apiRequest<PaginatedResponse<AvailabilityOut>>(
		url,
		{ method: 'GET' },
		'Failed to fetch availability'
	);

	// Zwracamy tylko tablicę results z odpowiedzi paginowanej
	return response.results;
}

export async function submitDemand(
	shiftsPerDay: Array<{
		weekday: number;
		shifts: Array<{
			timeFrom: string;
			timeTo: string;
			experienced: boolean;
			amount: number;
		}>;
	}>
): Promise<components['schemas']['DefaultDemandOut']> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const endpoint = `${baseUrl}/schedule/demand/default/bulk`;

	// Pobierz company_name z sesji
	const session = await auth();
	const location = session?.user?.company_name || null;

	// Przekształć dane do formatu API
	const payload: components['schemas']['DefaultDemandBulkIn'] = {
		location: location,
		defaults: shiftsPerDay.map((day) => ({
			weekday: day.weekday,
			items: day.shifts.map((shift) => ({
				start: shift.timeFrom,
				end: shift.timeTo,
				demand: shift.amount,
				needs_experienced: shift.experienced,
			})),
		})),
	};

	const response = await apiRequest<
		components['schemas']['DefaultDemandOut']
	>(
		endpoint,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		},
		'Failed to submit demand'
	);

	return response;
}

export async function fetchDefaultDemand(): Promise<
	components['schemas']['DefaultDemandOut']
> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const fullUrl = `${baseUrl}/schedule/demand/default`;

	// Pobierz company_name z sesji
	const session = await auth();
	const location = session?.user?.company_name || '';

	// Dodaj parametry query
	const url = new URL(fullUrl);
	url.searchParams.set('location', location);
	// weekday nie podajemy - chcemy wszystkie dni tygodnia

	const response = await apiRequest<
		components['schemas']['DefaultDemandOut']
	>(
		url,
		{
			method: 'GET',
		},
		'Failed to fetch default demand'
	);

	return response;
}

export async function generateSchedule(
	dateFrom: string,
	dateTo: string
): Promise<components['schemas']['GenerateResultOut']> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const endpoint = `${baseUrl}/schedule/generate-range`;

	// Pobierz company_name z sesji
	const session = await auth();
	const location = session?.user?.company_name || null;

	const payload: components['schemas']['GenerateRangeIn'] = {
		date_from: dateFrom,
		date_to: dateTo,
		location: location,
		persist: true,
		force: false,
		items: null,
	};

	const response = await apiRequest<
		components['schemas']['GenerateResultOut']
	>(
		endpoint,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		},
		'Failed to generate schedule'
	);

	console.dir(response, { depth: null });
	return response;
}

// Funkcja do pobierania szczegółów pracownika
export async function fetchEmployeeDetails(
	employeeId: string
): Promise<UserDetail> {
	const endpoint = `/api/accounts/employees/${employeeId}/`;
	const response = await apiRequest<UserDetail>(
		endpoint,
		{
			method: 'GET',
		},
		'Failed to fetch employee details'
	);
	return response;
}
