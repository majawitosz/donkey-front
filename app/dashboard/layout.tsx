/** @format */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { UserProvider } from '@/components/providers/user-provider';

export default function LayoutDashboard({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<UserProvider>
				<AppSidebar />
			</UserProvider>
			<main>
				<SidebarTrigger />
				{children}
			</main>
		</SidebarProvider>
	);
}
