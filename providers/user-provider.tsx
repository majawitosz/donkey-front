/** @format */

// providers/user-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { RoleEnum, User } from '@/lib/definitions/user';

const UserContext = createContext<User | null>(null);

export function UserProvider({
	user,
	children,
}: {
	user: User | null;
	children: React.ReactNode;
}) {
	const [value, setValue] = useState<User | null>(user);
	const { data } = useSession();

	useEffect(() => {
		setValue(user);
	}, [user]);

	useEffect(() => {
		if (data?.user) {
			setValue(data.user as User);
		}
	}, [data]);

	return (
		<UserContext.Provider value={value}>{children}</UserContext.Provider>
	);
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
