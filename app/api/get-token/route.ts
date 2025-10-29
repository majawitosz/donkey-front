/** @format */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
	const session = await auth();

	if (!session?.user?.accessToken) {
		return NextResponse.json(
			{ error: 'No access token available' },
			{ status: 401 }
		);
	}

	return NextResponse.json({ token: session.user.accessToken });
}
