/** @format */
'use client';

import AddEmployeeSection from '@/components/admin/add-employee-section';
import WorkerWeeklyScheduleView from '@/components/schedule/worker-schedule';
import { useUser } from '@/providers/user-provider';

export default function Dashboard() {
	const { isEmployee } = useUser();

	if (isEmployee) {
		return (
			<div className='container mx-auto py-6'>
				<WorkerWeeklyScheduleView />
			</div>
		);
	}

	return <AddEmployeeSection />;
}
