/** @format */

import NextAuth, { Session, User } from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { RoleEnum } from './lib/definitions/user';
import { JWT } from 'next-auth/jwt';
import { AdapterUser } from 'next-auth/adapters';
import { decodeJwtPayload } from './lib/token';

type RefreshResponse = {
	access: string;
	refresh?: string;
};

async function refreshAccessToken(token: JWT): Promise<JWT> {
	if (!token.refreshToken) {
		return {
			...token,
			error: 'MissingRefreshToken',
		};
	}

	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/accounts/token/refresh`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh: token.refreshToken }),
			}
		);

		if (!response.ok) {
			console.error('Failed to refresh access token', response.status);
			return {
				...token,
				error: 'RefreshAccessTokenError',
			};
		}

		const data = (await response.json()) as RefreshResponse;
		const decoded = decodeJwtPayload(data.access);
		return {
			...token,
			accessToken: data.access,
			accessTokenExpires: decoded.exp * 1000,
			refreshToken: data.refresh ?? token.refreshToken,
			error: undefined,
		};
	} catch (error) {
		console.error('Error refreshing access token', error);
		return {
			...token,
			error: 'RefreshAccessTokenError',
		};
	}
}

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
					`${process.env.NEXT_PUBLIC_API_URL}/accounts/login`,
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
		async jwt({
			token,
			user,
			trigger,
			session,
		}: {
			token: JWT;
			user?: User | AdapterUser;
			trigger?: 'signIn' | 'signUp' | 'signOut' | 'update';
			session?: Partial<Session> & {
				accessToken?: string;
				refreshToken?: string;
				accessTokenExpires?: number;
			};
		}) {
			if (user) {
				const typedUser = user as AdapterUser & User;
				token.id = Number(typedUser.id);
				token.email = typedUser.email;
				token.full_name = typedUser.full_name;
				token.first_name = typedUser.first_name;
				token.last_name = typedUser.last_name;
				token.role = typedUser.role as RoleEnum;
				token.company_id = typedUser.company_id;
				token.company_name = typedUser.company_name;
				token.is_active = typedUser.is_active;
				token.is_staff = typedUser.is_staff;
				token.accessToken = typedUser.accessToken;
				token.refreshToken = typedUser.refreshToken;

				try {
					const decoded = decodeJwtPayload(token.accessToken);
					console.log('token', token.accessToken);
					token.accessTokenExpires = decoded.exp * 1000;
				} catch (error) {
					console.error(
						'Failed to decode access token during sign in',
						error
					);
				}
			}

			if (trigger === 'update' && session) {
				if (session.accessToken) {
					token.accessToken = session.accessToken;
					try {
						const decoded = decodeJwtPayload(token.accessToken);
						token.accessTokenExpires = decoded.exp * 1000;
					} catch (error) {
						console.error(
							'Failed to decode updated access token',
							error
						);
						token.accessTokenExpires = undefined;
					}
				}
				if (session.refreshToken) {
					token.refreshToken = session.refreshToken;
				}
				if (session.accessTokenExpires) {
					token.accessTokenExpires = session.accessTokenExpires;
				}
			}

			if (!token.accessToken) {
				return token;
			}

			if (!token.accessTokenExpires) {
				try {
					const decoded = decodeJwtPayload(token.accessToken);
					token.accessTokenExpires = decoded.exp * 1000;
				} catch (error) {
					console.error(
						'Failed to decode existing access token',
						error
					);
					return token;
				}
			}

			if (Date.now() < (token.accessTokenExpires ?? 0) - 60_000) {
				return token;
			}

			return refreshAccessToken(token);
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			session.user.id = token.id;
			session.user.email = token.email;
			session.user.full_name = token.full_name;
			session.user.first_name = token.first_name;
			session.user.last_name = token.last_name;
			session.user.role = token.role;
			session.user.company_id = token.company_id;
			session.user.company_name = token.company_name;
			session.user.is_active = token.is_active;
			session.user.is_staff = token.is_staff;
			session.user.accessToken = token.accessToken;
			session.user.refreshToken = token.refreshToken;
			session.accessTokenExpires = token.accessTokenExpires;
			session.error = token.error;

			return session;
		},
	},
});
