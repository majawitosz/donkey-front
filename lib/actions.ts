/** @format */

'use server';

import { Company } from './definitions/user';

export async function registerCompany(values: Company) {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/register-company`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					accept: 'application/json',
				},
				body: JSON.stringify(values),
			}
		);

		if (!response.ok) {
			let errorMessage = 'Something went wrong';
			try {
				const errorData = await response.json();
				errorMessage = errorData.detail || errorMessage;
			} catch {}
			throw new Error(errorMessage);
		}

		const data = await response.json();
		console.log('Registered:', data);
		return data;
	} catch (err) {
		console.error('❌ Register failed:', err);
		throw err;
	}
}
