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
	role: RoleEnum;
	company_id: number;
	company_name: string;
	is_active: boolean;
	is_staff: boolean;
	accessToken: string;
	refreshToken: string;
};

export enum RoleEnum {
	OWNER = 'owner',
	MANAGER = 'manager',
	EMPLOYEE = 'employee',
}
