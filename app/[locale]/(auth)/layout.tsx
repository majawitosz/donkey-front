/** @format */

import { PublicHeader } from '@/components/ui/public-header';

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className='flex min-h-screen flex-col'>
			<PublicHeader />
			{children}
		</div>
	);
}
