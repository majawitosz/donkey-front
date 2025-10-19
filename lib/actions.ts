/** @format */

'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';

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
		redirectTo: '/',
	});
}

export async function fetchEmployees(search?: string) {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No access token');
	}

	const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/employees/`);
	if (search) {
		url.searchParams.set('search', search);
	}
	console.log('Fetching employees from:', url.toString());

	const response = await fetch(url.toString(), {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${session.user.accessToken}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		console.error(
			'Failed to fetch employees:',
			response.status,
			response.statusText
		);
		try {
			const errorText = await response.text();
			console.error('Response body:', errorText);
		} catch (e) {
			console.error('Could not read response body');
		}
		throw new Error('Failed to fetch employees');
	}

	return response.json();
}

export async function fetchPositions() {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No access token');
	}

	const url = `${process.env.NEXT_PUBLIC_API_URL}/positions/`;
	console.log('Fetching positions from:', url);

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${session.user.accessToken}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		console.error(
			'Failed to fetch positions:',
			response.status,
			response.statusText
		);
		try {
			const errorText = await response.text();
			console.error('Response body:', errorText);
		} catch (e) {
			console.error('Could not read response body');
		}
		throw new Error('Failed to fetch positions');
	}

	return response.json();
}

export async function createPosition(name: string) {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No access token');
	}

	const url = `${process.env.NEXT_PUBLIC_API_URL}/positions/`;
	console.log('Creating position at:', url);

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${session.user.accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ name }),
	});

	if (!response.ok) {
		console.error(
			'Failed to create position:',
			response.status,
			response.statusText
		);
		try {
			const errorText = await response.text();
			console.error('Response body:', errorText);
		} catch (e) {
			console.error('Could not read response body');
		}
		throw new Error('Failed to create position');
	}

	return response.json();
}

export async function updatePosition(id: number, name: string) {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No access token');
	}

	const url = `${process.env.NEXT_PUBLIC_API_URL}/positions/${id}/`;
	console.log('Updating position at:', url);

	const response = await fetch(url, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${session.user.accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ name }),
	});

	if (!response.ok) {
		console.error(
			'Failed to update position:',
			response.status,
			response.statusText
		);
		try {
			const errorText = await response.text();
			console.error('Response body:', errorText);
		} catch (e) {
			console.error('Could not read response body');
		}
		throw new Error('Failed to update position');
	}

	return response.json();
}

export async function deletePosition(id: number) {
	const session = await auth();
	if (!session?.user?.accessToken) {
		throw new Error('No access token');
	}

	const url = `${process.env.NEXT_PUBLIC_API_URL}/positions/${id}/`;
	console.log('Deleting position at:', url);

	const response = await fetch(url, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${session.user.accessToken}`,
			'Content-Type': 'application/json',
		},
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
		} catch (e) {
			console.error('Could not read response body');
		}
		throw new Error('Failed to delete position');
	}

	return true;
}
