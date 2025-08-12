/** @format */

import SignUpWorkerForm from '@/components/auth/signup-worker-form';
import { Suspense } from 'react';

export default function SignUpWorker() {
	return (
		<Suspense>
			<SignUpWorkerForm />
		</Suspense>
	);
}
