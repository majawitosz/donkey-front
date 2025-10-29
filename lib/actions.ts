/** @format */

'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';
import type { components } from '@/lib/types/openapi';

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

async function getAccessToken(): Promise<string> {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No access token');
	}
	return session.user.accessToken;
}

async function authorizedFetch(
	endpoint: string | URL,
	init: RequestInit = {}
): Promise<Response> {
	const accessToken = await getAccessToken();
	const headers = new Headers(init.headers);

	if (!headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${accessToken}`);
	}

	if (init.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	return fetch(resolveApiUrl(endpoint), {
		...init,
		headers,
	});
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
		throw new Error(errorMessage);
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
