/** @format */

// providers/user-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { RoleEnum, User } from '@/lib/definitions/user';
import { useAuthFetch } from '@/hooks/use-auth-fetch';
import { components } from '@/lib/types/openapi';

type CompanyLocationOut = components['schemas']['CompanyLocationOut'];

interface UserContextType {
	user: User | null;
	locations: CompanyLocationOut[];
	selectedLocation: CompanyLocationOut | null;
	setSelectedLocation: (location: CompanyLocationOut) => void;
	isLoadingLocations: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
	user,
	children,
}: {
	user: User | null;
	children: React.ReactNode;
}) {
	const [value, setValue] = useState<User | null>(user);
	const [locations, setLocations] = useState<CompanyLocationOut[]>([]);
	const [selectedLocation, setSelectedLocation] =
		useState<CompanyLocationOut | null>(null);
	const [isLoadingLocations, setIsLoadingLocations] = useState(false);
	const { data } = useSession();
	const authFetch = useAuthFetch();

	useEffect(() => {
		setValue(user);
	}, [user]);

	useEffect(() => {
		if (data?.user) {
			setValue(data.user as User);
		}
	}, [data]);

	useEffect(() => {
		const fetchLocations = async () => {
			if (!value) return;

			// Jeśli użytkownik nie jest managerem ani właścicielem, może nie mieć dostępu do wszystkich lokalizacji,
			// ale endpoint zdaje się zwracać lokalizacje "powiązane z firmą", więc dla pracownika też powinno działać.
			// Sprawdźmy jednak czy warto pobierać.

			setIsLoadingLocations(true);
			try {
				const response = await authFetch(
					`${process.env.NEXT_PUBLIC_API_URL}/schedule/locations`
				);
				if (response.ok) {
					const data = await response.json();
					setLocations(data);
					// Domyślnie wybierz pierwszą lokalizację, jeśli żadna nie jest wybrana
					if (data.length > 0 && !selectedLocation) {
						setSelectedLocation(data[0]);
					}
				}
			} catch (error) {
				console.error('Failed to fetch locations', error);
			} finally {
				setIsLoadingLocations(false);
			}
		};

		fetchLocations();
	}, [value?.id, authFetch]); // Zależy od ID użytkownika

	const contextValue: UserContextType = {
		user: value,
		locations,
		selectedLocation,
		setSelectedLocation,
		isLoadingLocations,
	};

	return (
		<UserContext.Provider value={contextValue}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);

	if (!context) {
		throw new Error('useUser must be used within a UserProvider');
	}

	const { user } = context;

	// Możemy dodać helpery
	const isOwner = user?.role === RoleEnum.OWNER;
	const isManager = user?.role === RoleEnum.MANAGER;
	const isEmployee = user?.role === RoleEnum.EMPLOYEE;

	return {
		...context,
		isOwner,
		isManager,
		isEmployee,
	};
}
