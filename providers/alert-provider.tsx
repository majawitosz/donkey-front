/** @format */

'use client';

import {
	createContext,
	useContext,
	useState,
	ReactNode,
	useCallback,
} from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'info';

type AlertData = {
	variant: AlertVariant;
	title: string;
	description?: string;
};

type AlertContextType = {
	showAlert: (data: AlertData, timeout?: number) => void;
	clearAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
	const [alert, setAlert] = useState<AlertData | null>(null);

	const showAlert = useCallback((data: AlertData, timeout = 10000) => {
		setAlert(data);
		if (timeout > 0) {
			setTimeout(() => setAlert(null), timeout);
		}
	}, []);

	const clearAlert = useCallback(() => setAlert(null), []);

	return (
		<AlertContext.Provider value={{ showAlert, clearAlert }}>
			{children}
			{alert && (
				<div className='fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none'>
					<div className='w-full max-w-md px-4'>
						<Alert
							variant={
								alert.variant === 'error'
									? 'destructive'
									: 'default'
							}>
							{alert.variant === 'success' && (
								<CheckCircle2Icon />
							)}
							{alert.variant === 'error' && <AlertCircleIcon />}
							<div>
								<AlertTitle>{alert.title}</AlertTitle>
								{alert.description && (
									<AlertDescription>
										{alert.description}
									</AlertDescription>
								)}
							</div>
						</Alert>
					</div>
				</div>
			)}
		</AlertContext.Provider>
	);
}

export function useAlert() {
	const context = useContext(AlertContext);
	if (!context) throw new Error('useAlert must be used within AlertProvider');
	return context;
}
