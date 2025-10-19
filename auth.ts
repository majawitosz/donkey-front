/** @format */

import NextAuth, { Session, User } from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { RoleEnum } from './lib/definitions/user';
import { JWT } from 'next-auth/jwt';
import { AdapterUser } from 'next-auth/adapters';

export const { auth, signIn, signOut, handlers } = NextAuth({
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
				console.log(data.access);
				return {
					id: data.user.id,
					email: data.user.email,
					first_name: data.user.first_name,
					last_name: data.user.last_name,
					full_name: data.user.full_name,
					role: data.user.role as RoleEnum,
					company_id: data.user.company_id,
					company_name: data.user.company_name,
					is_active: data.user.is_active,
					is_staff: data.user.is_staff,
					accessToken: data.access,
					refreshToken: data.refresh,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }: { token: JWT; user: User | AdapterUser }) {
			if (user) {
				token.id = Number(user.id);
				token.email = user.email;
				token.full_name = user.full_name;
				token.first_name = user.first_name;
				token.last_name = user.last_name;
				token.role = user.role as RoleEnum;
				token.company_id = user.company_id;
				token.company_name = user.company_name;
				token.accessToken = user.accessToken;
				token.refreshToken = user.refreshToken;
			}
			return token;
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			console.log('session', session.user.accessToken);
			console.log('token', token.accessToken);
			session.user.id = token.id;
			session.user.email = token.email;
			session.user.full_name = token.full_name;
			session.user.first_name = token.first_name;
			session.user.last_name = token.last_name;
			session.user.role = token.role;
			session.user.company_id = token.company_id;
			session.user.accessToken = token.accessToken;
			session.user.refreshToken = token.refreshToken;

			return session;
		},
	},
});
