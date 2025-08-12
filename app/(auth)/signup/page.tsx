/** @format */

import SignUpForm from '@/components/auth/signup-form';
import { Suspense } from 'react';

export default function SignUp() {
	return (
		<Suspense>
			<SignUpForm />
		</Suspense>
	);
}
