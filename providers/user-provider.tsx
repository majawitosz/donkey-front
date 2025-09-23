/** @format */

// providers/user-provider.tsx
'use client';

import { RoleEnum, User } from '@/lib/definitions/user';
import { createContext, useContext } from 'react';

const UserContext = createContext<User | null>(null);

export function UserProvider({
	user,
	children,
}: {
	user: User | null;
	children: React.ReactNode;
}) {
	return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
	const user = useContext(UserContext);

	// Możemy dodać helpery
	const isOwner = user?.role === RoleEnum.OWNER;
	const isManager = user?.role === RoleEnum.MANAGER;
	const isEmployee = user?.role === RoleEnum.EMPLOYEE;

	return {
		user,
		isOwner,
		isManager,
		isEmployee,
	};
}
