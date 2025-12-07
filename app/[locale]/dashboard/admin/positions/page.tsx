/** @format */

import PositionsPage from '@/components/admin/positions';
import { Suspense } from 'react';

export default function Employees() {
	return (
		<Suspense>
			<PositionsPage />
		</Suspense>
	);
}
