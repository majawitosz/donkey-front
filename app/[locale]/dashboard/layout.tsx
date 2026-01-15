/** @format */

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { auth } from '@/auth';
import { UserProvider } from '@/providers/user-provider';
import { SiteHeader } from '@/components/ui/site-header';
import { SessionMonitor } from '@/providers/session-monitor';

export default async function LayoutDashboard({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	return (
		<UserProvider user={session?.user ?? null}>
			<SessionMonitor />
			<SidebarProvider
				style={
					{
						'--sidebar-width': 'calc(var(--spacing) * 72)',
						'--header-height': 'calc(var(--spacing) * 12)',
					} as React.CSSProperties
				}>
				<AppSidebar />
				<SidebarInset>
					<SiteHeader />
					<div className='flex flex-1 flex-col  gap-4 p-4 pt-0'>
						<div className='@container/main flex flex-1 flex-col gap-2'>
							<div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
								<main>{children}</main>
							</div>
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</UserProvider>
	);
}
