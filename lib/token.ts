/** @format */

export type JwtPayload = {
	exp: number;
	[i: string]: unknown;
};

function normalizeBase64(base64: string): string {
	const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
	const paddingNeeded = (4 - (normalized.length % 4)) % 4;
	return normalized + '='.repeat(paddingNeeded);
}

export function decodeJwtPayload<
	T extends Record<string, unknown> = JwtPayload
>(token: string): T {
	const parts = token?.split('.') ?? [];
	if (parts.length < 2) {
		throw new Error('Invalid JWT token format');
	}
	const payloadBase64 = normalizeBase64(parts[1]);

	let decoded: string;
	if (typeof window === 'undefined') {
		decoded = Buffer.from(payloadBase64, 'base64').toString('utf-8');
	} else {
		decoded = atob(payloadBase64);
	}

	return JSON.parse(decoded) as T;
}
