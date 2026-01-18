/** @format */
/// <reference types="next-auth" />

import { RoleEnum } from './lib/definitions/user';

declare module 'next-auth' {
	interface Session {
		user: {
			id: number;
			email: string;
			first_name: string;
			last_name: string;
			role: RoleEnum;
			company_id: number;
			company_name?: string;
			is_active?: boolean;
			is_staff?: boolean;
			accessToken: string;
			refreshToken: string;
		};
		accessTokenExpires?: number;
		error?: string;
	}

	interface User {
		id: number;
		email: string;
		first_name: string;
		last_name: string;
		role: RoleEnum;
		company_id: number;
		company_name?: string;
		is_active?: boolean;
		is_staff?: boolean;
		accessToken: string;
		refreshToken: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id: number;
		email: string;
		first_name: string;
		last_name: string;
		role: RoleEnum;
		company_id: number;
		company_name?: string;
		is_active?: boolean;
		is_staff?: boolean;
		accessToken: string;
		refreshToken: string;
		accessTokenExpires?: number;
		error?: string;
	}
}
