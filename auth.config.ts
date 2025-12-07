/** @format */

import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
	pages: {
		signIn: '/login',
		error: '/login',
	},
	callbacks: {
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user;
			const isOnDashboard =
				nextUrl.pathname.match(/^\/(?:en|pl)\/dashboard/) ||
				nextUrl.pathname.startsWith('/dashboard');
			const locale =
				nextUrl.pathname.split('/')[1] === 'en' ? 'en' : 'pl';

			if (isOnDashboard) {
				if (isLoggedIn) return true;
				return Response.redirect(new URL(`/${locale}/login`, nextUrl));
			} else if (isLoggedIn) {
				// Prevent redirect loop if already on dashboard
				if (isOnDashboard) return true;
				return Response.redirect(
					new URL(`/${locale}/dashboard`, nextUrl)
				);
			}
			return true;
		},
	},
	providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
