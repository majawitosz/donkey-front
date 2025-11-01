/** @format */
'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { signOutUser } from '@/lib/actions';

export function SessionMonitor() {
	const { data: session, status } = useSession();

	useEffect(() => {
		if (
			session?.error === 'RefreshAccessTokenError' ||
			session?.error === 'MissingRefreshToken'
		) {
			console.error(
				'❌ Session error detected, signing out:',
				session.error
			);
			signOutUser();
		}
	}, [session?.error]);
	return null;
}
