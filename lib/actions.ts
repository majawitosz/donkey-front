/** @format */

'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

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

type CompanyCodeResponse = {
	code: string;
};

type EmployeeCountResponse = {
	count: number;
};

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

export async function fetchEmployees(search?: string) {
	const url = new URL('employees/', API_BASE_URL);
	if (search) {
		url.searchParams.set('search', search);
	}
	return apiRequest(url, { method: 'GET' }, 'Failed to fetch employees');
}

export async function fetchPositions() {
	return apiRequest(
		'positions/',
		{ method: 'GET' },
		'Failed to fetch positions'
	);
}

export async function createPosition(name: string) {
	return apiRequest(
		'positions/',
		{ method: 'POST', body: JSON.stringify({ name }) },
		'Failed to create position'
	);
}

export async function updatePosition(id: number, name: string) {
	return apiRequest(
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

export async function fetchEmployeeCount(): Promise<EmployeeCountResponse> {
	return apiRequest<EmployeeCountResponse>(
		'employees/count/',
		{ method: 'GET' },
		'Failed to fetch employee count'
	);
}
