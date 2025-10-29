/** @format */

'use client';

import { useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { decodeJwtPayload } from '@/lib/token';

function buildHeaders(init?: RequestInit, accessToken?: string) {
	const headers = new Headers(init?.headers ?? {});

	if (accessToken && !headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${accessToken}`);
	}

	if (!headers.has('Content-Type') && init?.body) {
		headers.set('Content-Type', 'application/json');
	}

	return headers;
}

type RefreshResult = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpires: number;
};

export function useAuthFetch() {
	const { data: session, update } = useSession();

	const performRefresh =
		useCallback(async (): Promise<RefreshResult | null> => {
			if (!session?.user?.refreshToken) {
				return null;
			}

			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/accounts/token/refresh`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							refresh: session.user.refreshToken,
						}),
					}
				);

				if (!response.ok) {
					return null;
				}

				const data = await response.json();
				const accessToken = data.access as string;
				const refreshToken =
					(data.refresh as string | undefined) ??
					session.user.refreshToken;
				const decoded = decodeJwtPayload(accessToken);
				const accessTokenExpires = decoded.exp * 1000;

				await update({
					accessToken,
					refreshToken,
					accessTokenExpires,
				});

				return { accessToken, refreshToken, accessTokenExpires };
			} catch (error) {
				console.error('Failed to refresh access token silently', error);
				return null;
			}
		}, [session, update]);

	const fetchWithAuth = useCallback(
		async (input: RequestInfo | URL, init?: RequestInit) => {
			if (!session?.user?.accessToken) {
				throw new Error('No access token available');
			}

			let accessToken = session.user.accessToken;
			const expiresAt = session.accessTokenExpires ?? 0;

			if (expiresAt && Date.now() > expiresAt - 30_000) {
				const refreshed = await performRefresh();
				if (refreshed) {
					accessToken = refreshed.accessToken;
				} else {
					await signOut({ callbackUrl: '/login' });
					throw new Error('Unable to refresh session');
				}
			}

			const executeFetch = (token: string) =>
				fetch(input, {
					...init,
					headers: buildHeaders(init, token),
				});

			let response = await executeFetch(accessToken);

			if (response.status !== 401) {
				return response;
			}

			const refreshed = await performRefresh();
			if (!refreshed) {
				await signOut({ callbackUrl: '/login' });
				return response;
			}

			response = await executeFetch(refreshed.accessToken);

			if (response.status === 401) {
				await signOut({ callbackUrl: '/login' });
			}

			return response;
		},
		[performRefresh, session]
	);

	return fetchWithAuth;
}
