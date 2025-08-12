/** @format */
import LoginForm from '@/components/auth/login-form';
import { Suspense } from 'react';

export default function Login() {
	return (
		<Suspense>
			<LoginForm />
		</Suspense>
	);
}
