/** @format */

import { Suspense } from 'react';
import EmployeesTable from '@/components/admin/employees-table';

export default function Employees() {
	return (
		<Suspense>
			<EmployeesTable />
		</Suspense>
	);
}
