/** @format */
'use client';

import {
	Calendar,
	ChevronUp,
	Home,
	Inbox,
	Search,
	Settings,
	User,
	User2,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './dropdown-menu';
import { signOutUser } from '@/lib/actions';
import { useUser } from '@/providers/user-provider';
import { RoleEnum } from '@/lib/definitions/user';

const items = [
	{
		title: 'Home',
		url: '#',
		icon: Home,
	},
	{
		title: 'Inbox',
		url: '#',
		icon: Inbox,
	},
	{
		title: 'Calendar',
		url: '#',
		icon: Calendar,
	},
	{
		title: 'Search',
		url: '#',
		icon: Search,
	},
	{
		title: 'Settings',
		url: '#',
		icon: Settings,
	},
];

export function AppSidebar() {
	const { user, isOwner, isEmployee, isManager } = useUser();
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}

							{isOwner && (
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<a href='/dashboard/admin/employees'>
											<User />
											<span>Employees</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
							{isEmployee && (
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<a href='#/worker'>
											<User2 />
											<span>Worker panel</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton>
										<User2 /> {user?.full_name ?? 'guest'}
										<ChevronUp className='ml-auto' />
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side='top'
									className='w-[--radix-popper-anchor-width]'>
									<DropdownMenuItem>
										<span>Account</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<span>Billing</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<form action={signOutUser}>
											<button>Sign out</button>
										</form>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</SidebarContent>
		</Sidebar>
	);
}
