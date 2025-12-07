/** @format */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
	locales: ['en', 'pl'],
	defaultLocale: 'pl',
});

const { auth } = NextAuth(authConfig);

export default auth((req) => {
	return intlMiddleware(req);
});

export const config = {
	// https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
	matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
