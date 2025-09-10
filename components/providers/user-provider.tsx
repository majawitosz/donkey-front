/** @format */
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@/lib/definitions/user';

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isEmployee: boolean;
  isOwner: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load user');
      const data = (await res.json()) as { user: User | null };
      setUser(data.user ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const ctx = useMemo<UserContextValue>(
    () => ({
      user,
      isLoading,
      error,
      refresh: load,
      isEmployee: user?.role === 'employee',
      isOwner: user?.role === 'company_owner',
    }),
    [user, isLoading, error]
  );

  return <UserContext.Provider value={ctx}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
