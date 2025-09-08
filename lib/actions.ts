/** @format */

'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

// export async function Login(values: Credentials) {
// 	 return await signIn('credentials', {
//     redirect: false,
//     email: formData.get('email'),
//     password: formData.get('password'),
//   });
// }

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		await signIn('credentials', {
			email: formData.get('email'),
			password: formData.get('password'),
			redirect: false,
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
