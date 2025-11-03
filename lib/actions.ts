/** @format */

'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import type { components } from '@/lib/types/openapi';
import { decodeJwtPayload } from './token';

const API_ROOT_URL = process.env.NEXT_PUBLIC_API_URL
	? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
	: undefined;
const ACCOUNTS_BASE_URL = API_ROOT_URL
	? `${API_ROOT_URL}/accounts/`
	: undefined;

type Position = components['schemas']['Position'];
type UserDetail = components['schemas']['UserList'];
type AvailabilityOut = components['schemas']['AvailabilityOut'];
type CompanyCodeResponse = components['schemas']['CompanyCode'];
type CalendarEventOut = components['schemas']['CalendarEventOut'];
type MedicalEventOut = components['schemas']['MedicalEventOut'];
type ExternalCalendarOut = components['schemas']['ExternalCalendarOut'];

export interface CalendarEvent {
	id: string;
	title: string;
	description?: string | null;
	start: string;
	end?: string | null;
	type?: string | null;
	category?: string | null;
	location?: string | null;
	all_day?: boolean | null;
	allDay?: boolean | null;
	status?: string | null;
	exam_type?: string | null;
	notes?: string | null;
	color?: string | null;
	external_calendar?: string | null;
	externalCalendar?: string | null;
	original_category?: string | null;
	employee_id?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
	[key: string]: unknown;
}

export interface CalendarIntegration {
	id: string;
	provider: string;
	connected: boolean;
	last_sync_at?: string | null;
	last_synced_at?: string | null;
	status?: string | null;
	sync_error?: string | null;
	primary_calendar?: string | null;
	name?: string | null;
	provider_code?: string | null;
	active?: boolean | null;
	external_id?: string | null;
	employee_id?: string | null;
	settings?: Record<string, unknown> | null;
	sync_token?: string | null;
	[key: string]: unknown;
}

export interface CalendarOverview {
	events: CalendarEvent[];
	integrations: CalendarIntegration[];
}

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
	if (!API_ROOT_URL) {
		throw new Error('API base URL is not defined');
	}

	const normalized = endpoint.replace(/^\/+/, '');

	if (normalized.startsWith('api/')) {
		const rootWithoutApi = API_ROOT_URL.replace(/\/api$/, '');
		return `${rootWithoutApi}/${normalized}`;
	}

	if (
		normalized.startsWith('schedule/') ||
		normalized.startsWith('calendar/') ||
		normalized.startsWith('accounts/')
	) {
		return `${API_ROOT_URL}/${normalized}`;
	}

	if (!ACCOUNTS_BASE_URL) {
		throw new Error('Accounts API base URL is not defined');
	}

	return new URL(normalized, ACCOUNTS_BASE_URL).toString();
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

export async function fetchCalendarOverview(): Promise<CalendarOverview> {
	if (!API_ROOT_URL) {
		throw new Error('NEXT_PUBLIC_API_URL is not defined');
	}

	const eventsUrl = new URL(`${API_ROOT_URL}/calendar/events`);
	eventsUrl.searchParams.set('limit', '200');
	// Ensure category is present as a string (FastAPI will validate type)
	eventsUrl.searchParams.set('category', '');

	// Provide safe defaults for query parameters so FastAPI doesn't reject them
	// if the backend expects certain typed query params. Use ISO strings for
	// datetimes and string/boolean values as appropriate.
	const now = new Date();
	const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
	const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

	// Strings: employee_id and status (empty string is a valid string)
	eventsUrl.searchParams.set('employee_id', '');
	eventsUrl.searchParams.set('status', '');
	// Datetimes: send ISO strings
	eventsUrl.searchParams.set('start_from', defaultStart.toISOString());
	eventsUrl.searchParams.set('end_to', defaultEnd.toISOString());

	const medicalUrl = new URL(`${API_ROOT_URL}/calendar/medical`);
	medicalUrl.searchParams.set('limit', '200');
	// Medical events use the same default date range and optional string filters
	medicalUrl.searchParams.set('employee_id', '');
	medicalUrl.searchParams.set('status', '');
	medicalUrl.searchParams.set('start_from', defaultStart.toISOString());
	medicalUrl.searchParams.set('end_to', defaultEnd.toISOString());

	const integrationsUrl = new URL(`${API_ROOT_URL}/calendar/sources`);
	integrationsUrl.searchParams.set('limit', '100');
	// External calendars: provider should be a string, active a boolean-like value
	integrationsUrl.searchParams.set('provider', '');
	integrationsUrl.searchParams.set('active', String(true));

	const [eventsResult, medicalResult, integrationsResult] =
		await Promise.allSettled([
			apiRequest<CalendarEventOut[]>(
				eventsUrl,
				{ method: 'GET' },
				'Failed to fetch calendar events'
			),
			apiRequest<MedicalEventOut[]>(
				medicalUrl,
				{ method: 'GET' },
				'Failed to fetch medical calendar events'
			),
			apiRequest<ExternalCalendarOut[]>(
				integrationsUrl,
				{ method: 'GET' },
				'Failed to fetch external calendars'
			),
		]);

	const events: CalendarEvent[] = [];

	if (eventsResult.status === 'fulfilled') {
		events.push(...eventsResult.value.map(mapApiCalendarEvent));
	} else {
		console.error(eventsResult.reason);
	}

	if (medicalResult.status === 'fulfilled') {
		events.push(...medicalResult.value.map(mapMedicalEvent));
	} else {
		console.error(medicalResult.reason);
	}

	const integrations: CalendarIntegration[] = [];

	if (integrationsResult.status === 'fulfilled') {
		integrations.push(...integrationsResult.value.map(mapExternalCalendar));
	} else {
		console.error(integrationsResult.reason);
	}

	return {
		events,
		integrations,
	};
}

function normalizeEventCategory(category: string | null | undefined): string {
	if (!category) {
		return 'schedule';
	}

	const normalized = category.toLowerCase();

	if (normalized === 'leave' || normalized === 'vacation') {
		return 'vacation';
	}
	if (normalized === 'training') {
		return 'training';
	}
	if (normalized === 'medical') {
		return 'medical';
	}

	return 'schedule';
}

function mapApiCalendarEvent(event: CalendarEventOut): CalendarEvent {
	const category = normalizeEventCategory(event.category);
	const end = event.end_at ?? event.start_at;

	const normalized: CalendarEvent = {
		id: String(event.id),
		title: event.title ?? '',
		description: event.description ?? null,
		start: event.start_at ?? '',
		end,
		type: category,
		category,
		location: event.location ?? null,
		color: event.color ?? null,
		all_day: null,
		allDay: null,
	};

	normalized.original_category = event.category ?? null;
	normalized.employee_id = event.employee_id ?? null;
	normalized.created_at = event.created_at ?? null;
	normalized.updated_at = event.updated_at ?? null;

	return normalized;
}

function mapMedicalEvent(event: MedicalEventOut): CalendarEvent {
	const end = event.end_at ?? event.start_at;

	const normalized: CalendarEvent = {
		id: String(event.id),
		title: event.title ?? '',
		description: event.description ?? event.notes ?? null,
		start: event.start_at ?? '',
		end,
		type: 'medical',
		category: 'medical',
		location: event.location ?? null,
		status: event.status ?? null,
		exam_type: event.exam_type ?? null,
		notes: event.notes ?? null,
		all_day: null,
		allDay: null,
	};

	normalized.employee_id = event.employee_id ?? null;
	normalized.created_at = event.created_at ?? null;
	normalized.updated_at = event.updated_at ?? null;

	return normalized;
}

function mapExternalCalendar(
	integration: ExternalCalendarOut
): CalendarIntegration {
	const providerLabel = formatProviderName(integration.provider);
	const connectionName = integration.name?.trim() || providerLabel;
	const lastSynced = integration.last_synced_at ?? null;
	const isActive = integration.active ?? true;

	const normalized: CalendarIntegration = {
		id: String(integration.id),
		provider: connectionName,
		name: integration.name ?? connectionName,
		provider_code: integration.provider ?? null,
		connected: Boolean(isActive),
		active: integration.active ?? null,
		last_sync_at: lastSynced,
		last_synced_at: lastSynced,
		primary_calendar: integration.external_id ?? null,
		external_id: integration.external_id ?? null,
		status: isActive ? 'active' : 'inactive',
	};

	normalized.employee_id = integration.employee_id ?? null;
	normalized.settings = integration.settings ?? null;
	normalized.sync_token = integration.sync_token ?? null;

	return normalized;
}

function formatProviderName(provider?: string | null): string {
	if (!provider) {
		return 'Inny kalendarz';
	}

	const normalized = provider.toLowerCase();

	switch (normalized) {
		case 'google':
			return 'Google Calendar';
		case 'outlook':
			return 'Microsoft Outlook';
		case 'ics':
			return 'Plik ICS';
		case 'other':
			return 'Inny kalendarz';
		default:
			return provider.charAt(0).toUpperCase() + provider.slice(1);
	}
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
	if (!ACCOUNTS_BASE_URL) {
		throw new Error('API base URL is not defined');
	}
	const url = new URL('employees/', ACCOUNTS_BASE_URL);
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

export async function fetchAvailability(params: {
	employee_id: string; // Teraz wymagane!
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

	// Backend FastAPI wymaga employee_id jako obowiązkowy parametr
	url.searchParams.set('employee_id', params.employee_id);

	if (params.date_from) {
		url.searchParams.set('date_from', params.date_from);
	}
	if (params.date_to) {
		url.searchParams.set('date_to', params.date_to);
	}
	url.searchParams.set(
		'only_with_slots',
		String(params.only_with_slots ?? false)
	);
	url.searchParams.set('limit', String(params.limit ?? 100));
	url.searchParams.set('offset', String(params.offset ?? 0));

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
	dateTo: string,
	force: boolean = false
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
		force: force,
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

export async function updateShift(
	shiftData: components['schemas']['ShiftUpdateIn']
): Promise<components['schemas']['ShiftOut']> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const endpoint = `${baseUrl}/schedule/schedule/shift`;
	const response = await apiRequest<components['schemas']['ShiftOut']>(
		endpoint,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(shiftData),
		},
		'Failed to update shift'
	);
	return response;
}

export async function createCalendarEvent(formData: FormData) {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const endpoint = `${baseUrl}/calendar/events`;

	// Convert datetime-local to ISO string with timezone
	const startAt = formData.get('start_at') as string;
	const endAt = formData.get('end_at') as string;

	const payload: Record<string, unknown> = {
		title: String(formData.get('title') ?? ''),
		description: (formData.get('description') as string) || null,
		start_at: startAt ? new Date(startAt).toISOString() : null,
		end_at: endAt ? new Date(endAt).toISOString() : null,
		category: (formData.get('category') as string) || null,
		employee_id: (formData.get('employee_id') as string) || null,
		location: (formData.get('location') as string) || null,
		color: (formData.get('color') as string) || null,
	};

	await apiRequest(
		endpoint,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		},
		'Failed to create calendar event'
	);

	// Redirect back to calendars page after successful creation
	redirect('/dashboard/admin/calendars');
}

export async function createMedicalEvent(formData: FormData) {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const endpoint = `${baseUrl}/calendar/medical`;

	// Convert datetime-local to ISO string with timezone
	const startAt = formData.get('start_at') as string;
	const endAt = formData.get('end_at') as string;

	const payload: Record<string, unknown> = {
		title: String(formData.get('title') ?? ''),
		description: (formData.get('description') as string) || null,
		start_at: startAt ? new Date(startAt).toISOString() : null,
		end_at: endAt ? new Date(endAt).toISOString() : null,
		employee_id: (formData.get('employee_id') as string) || null,
		location: (formData.get('location') as string) || null,
		exam_type: (formData.get('exam_type') as string) || null,
		status: (formData.get('status') as string) || null,
		notes: (formData.get('notes') as string) || null,
	};

	await apiRequest(
		endpoint,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		},
		'Failed to create medical event'
	);

	// Redirect back to calendars page after successful creation
	redirect('/dashboard/admin/calendars');
}
