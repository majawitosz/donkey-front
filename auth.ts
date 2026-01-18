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
		console.error('No refresh token available');
		return {
			...token,
			error: 'MissingRefreshToken',
		};
	}

	try {
		console.log('🔄 Refreshing access token in auth.ts...');
		console.log(token.refreshToken);
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/accounts/token/refresh`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh: token.refreshToken }),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				'Failed to refresh access token',
				response.status,
				errorText,
			);
			return {
				...token,
				error: 'RefreshAccessTokenError',
			};
		}

		const data = (await response.json()) as RefreshResponse;

		if (!data.access) {
			console.error('No access token in refresh response');
			return {
				...token,
				error: 'RefreshAccessTokenError',
			};
		}

		try {
			const decoded = decodeJwtPayload(data.access);
			console.log(
				'Token refreshed successfully, expires at:',
				new Date(decoded.exp * 1000).toISOString(),
			);

			return {
				...token,
				accessToken: data.access,
				accessTokenExpires: decoded.exp * 1000,
				refreshToken: data.refresh ?? token.refreshToken,
				error: undefined,
			};
		} catch (decodeError) {
			console.error('Failed to decode new access token', decodeError);
			return {
				...token,
				error: 'RefreshAccessTokenError',
			};
		}
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
					},
				);

				if (!res.ok) return null;
				const data = await res.json();
				console.log('auth.ts', data);

				return {
					id: data.user.id,
					email: data.user.email,
					first_name: data.user.first_name,
					last_name: data.user.last_name,
					role: data.user.role as RoleEnum,
					company_id: data.user.company_id,
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
				console.log('User signed in, initializing token');
				const typedUser = user as AdapterUser & User;
				token.id = Number(typedUser.id);
				token.email = typedUser.email;
				token.first_name = typedUser.first_name;
				token.last_name = typedUser.last_name;
				token.role = typedUser.role as RoleEnum;
				token.company_id = typedUser.company_id;
				token.accessToken = typedUser.accessToken;
				token.refreshToken = typedUser.refreshToken;

				try {
					const decoded = decodeJwtPayload(token.accessToken);
					token.accessTokenExpires = decoded.exp * 1000;
					console.log(
						'Initial token expires at:',
						new Date(decoded.exp * 1000).toISOString(),
					);
				} catch (error) {
					console.error(
						'Failed to decode access token during sign in',
						error,
					);
				}
				return token;
			}

			if (trigger === 'update' && session) {
				console.log('🔄 Session update triggered');
				if (session.accessToken) {
					token.accessToken = session.accessToken;
					try {
						const decoded = decodeJwtPayload(token.accessToken);
						token.accessTokenExpires = decoded.exp * 1000;
						console.log(
							'Updated token expires at:',
							new Date(decoded.exp * 1000).toISOString(),
						);
					} catch (error) {
						console.error(
							'Failed to decode updated access token',
							error,
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
				return token;
			}

			if (!token.accessToken) {
				console.error('No access token in JWT callback');
				return token;
			}

			if (!token.accessTokenExpires) {
				try {
					const decoded = decodeJwtPayload(token.accessToken);
					token.accessTokenExpires = decoded.exp * 1000;
					console.log(
						'Restored token expiry:',
						new Date(decoded.exp * 1000).toISOString(),
					);
				} catch (error) {
					console.error(
						'Failed to decode existing access token',
						error,
					);
					return token;
				}
			}

			const now = Date.now();
			const timeUntilExpiry = token.accessTokenExpires - now;
			const bufferTime = 60_000;
			if (timeUntilExpiry > bufferTime) {
				console.log(
					`Token still valid for ${Math.round(
						timeUntilExpiry / 1000,
					)}s`,
				);
				return token;
			}

			console.log(
				`Token expires soon (${Math.round(
					timeUntilExpiry / 1000,
				)}s), refreshing...`,
			);
			return refreshAccessToken(token);
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			if (token.error) {
				console.error('Token error in session:', token.error);
				session.error = token.error;
			}

			session.user.id = token.id;
			session.user.email = token.email;
			session.user.first_name = token.first_name;
			session.user.last_name = token.last_name;
			session.user.role = token.role;
			session.user.company_id = token.company_id;
			session.user.accessToken = token.accessToken;
			session.user.refreshToken = token.refreshToken;
			session.accessTokenExpires = token.accessTokenExpires;
			session.error = token.error;

			return session;
		},
	},
});
