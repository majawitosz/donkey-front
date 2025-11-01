/** @format */
'use server';

import { auth } from '@/auth';
import { decodeJwtPayload } from './token';

/**
 * Funkcja pomocnicza do debugowania stanu sesji i tokenów
 */
export async function debugSession() {
	const session = await auth();

	if (!session) {
		console.log('❌ No session found');
		return {
			hasSession: false,
			error: 'No session',
		};
	}

	console.log('📋 Session Debug Info:');
	console.log('  User ID:', session.user?.id);
	console.log('  Email:', session.user?.email);
	console.log('  Has Access Token:', !!session.user?.accessToken);
	console.log('  Has Refresh Token:', !!session.user?.refreshToken);
	console.log('  Session Error:', session.error || 'None');

	if (session.user?.accessToken) {
		try {
			const decoded = decodeJwtPayload(session.user.accessToken);
			const expiresAt = new Date(decoded.exp * 1000);
			const now = new Date();
			const isExpired = now > expiresAt;
			const timeLeft = Math.round(
				(expiresAt.getTime() - now.getTime()) / 1000
			);

			console.log('  Token Expires:', expiresAt.toISOString());
			console.log('  Token Expired:', isExpired);
			console.log('  Time Left:', timeLeft, 'seconds');

			return {
				hasSession: true,
				hasAccessToken: true,
				hasRefreshToken: !!session.user.refreshToken,
				tokenExpires: expiresAt.toISOString(),
				tokenExpired: isExpired,
				timeLeft: timeLeft,
				error: session.error,
			};
		} catch (error) {
			console.error('  ❌ Failed to decode token:', error);
			return {
				hasSession: true,
				hasAccessToken: true,
				hasRefreshToken: !!session.user.refreshToken,
				error: 'Failed to decode token',
			};
		}
	}

	return {
		hasSession: true,
		hasAccessToken: false,
		hasRefreshToken: !!session.user?.refreshToken,
		error: session.error || 'No access token',
	};
}
