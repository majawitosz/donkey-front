/** @format */

import { fetchEmployee, fetchPositions } from '@/lib/actions';
import { EmployeeDetailsForm } from '@/components/admin/employee-details-form';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default async function EmployeeDetailsPage({
	params,
}: {
	params: Promise<{ id: string; locale: string }>;
}) {
	const { id } = await params;
	const [employee, positions] = await Promise.all([
		fetchEmployee(id).catch(() => null),
		fetchPositions(),
	]);

	if (!employee) {
		notFound();
	}

	const t = await getTranslations('EmployeeDetails');

	return (
		<div className='flex-1 space-y-4 p-8 pt-6 max-w-4xl mx-auto'>
			<div className='flex items-center justify-between space-y-2 mb-6'>
				<h2 className='text-3xl font-bold tracking-tight'>
					{t('title', {
						name: `${employee.first_name} ${employee.last_name}`,
					})}
				</h2>
			</div>
			<EmployeeDetailsForm employee={employee} positions={positions} />
		</div>
	);
}
