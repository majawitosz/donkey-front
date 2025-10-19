/** @format */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { auth } from '@/auth';
import { UserProvider } from '@/providers/user-provider';

export default async function LayoutDashboard({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	return (
		<UserProvider user={session?.user ?? null}>
			<SidebarProvider>
				<AppSidebar />
				<main>
					<SidebarTrigger />
					{children}
				</main>
			</SidebarProvider>
		</UserProvider>
	);
}
