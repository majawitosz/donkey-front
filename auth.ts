/** @format */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

export const { auth, signIn, signOut } = NextAuth({
	...authConfig,
	providers: [
		Credentials({
			async authorize(credentials) {
				const parsedCredentials = z
					.object({
						email: z.email({
							message: 'Nieprawidłowy adres email.',
						}),
						password: z
							.string()
							.min(1, { message: 'Hasło jest wymagane.' }),
					})
					.safeParse(credentials);

				if (!parsedCredentials.success) {
					console.log('Invalid credentials format');
					return null;
				}
				const { email, password } = credentials;
				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/login`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							email: email,
							password: password,
						}),
					}
				);

				if (!res.ok) return null;
				const data = await res.json();
				console.log('auth.ts', data);

				return {
					email: data.user.email,
					name: data.user.full_name,
					role: data.user.role,
					companyId: data.user.company_id,
					accessToken: data.access,
					refreshToken: data.refresh,
				};
			},
		}),
	],
	callbacks: {},
});
