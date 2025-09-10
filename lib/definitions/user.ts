/** @format */

export type Company = {
	company_name: string;
	first_name: string;
	last_name: string;
	nip: string;
	email: string;
	password: string;
};

export type Credentials = {
	email: string;
	password: string;
};

export type User = {
	id: number;
	email: string;
	first_name: string;
	last_name: string;
	full_name: string;
	role: string;
	company_id: number | null;
	company_name: string | null;
	is_active: boolean;
	is_staff: boolean;
};

type AuthResponse = {
	access: string;
	refresh: string;
	user: User;
};
