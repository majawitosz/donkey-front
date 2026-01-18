/** @format */

import NewLocationForm from '@/components/admin/settings/new-location-form';

export default function NewLocationPage() {
	return (
		<div className='flex-1 space-y-4 p-8 pt-6'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-3xl font-bold tracking-tight'>
					Add New Location
				</h2>
			</div>
			<div className='space-y-4'>
				<NewLocationForm />
			</div>
		</div>
	);
}
