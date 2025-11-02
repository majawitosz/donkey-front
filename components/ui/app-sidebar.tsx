/** @format */
'use client';

import {
	Calendar,
	Home,
	Search,
	Settings,
	User2,
	UserSearch,
	IdCardLanyard,
	GalleryVerticalEnd,
	AudioWaveform,
	Command,
        CalendarCog,
        CalendarPlus,
        CalendarRange,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useUser } from '@/providers/user-provider';
import { TeamSwitcher } from './team-switcher';
import { NavUser } from './nav-user';

const data = [
	{
		title: 'Home',
		url: '/dashboard',
		icon: Home,
	},
	{
		title: 'Positions',
		url: '/dashboard/admin/positions',
		icon: IdCardLanyard,
	},
	{
		title: 'Availability',
		url: '/dashboard/admin/availability',
		icon: Calendar,
	},
	{
		title: 'Demand',
		url: '/dashboard/admin/demand',
		icon: CalendarCog,
	},
        {
                title: 'Schedule',
                url: '/dashboard/admin/schedule',
                icon: CalendarPlus,
        },
        {
                title: 'Calendars',
                url: '/dashboard/admin/calendars',
                icon: CalendarRange,
        },
];
const teams = [
	{
		name: 'Acme Inc',
		logo: GalleryVerticalEnd,
		plan: 'Enterprise',
	},
	{
		name: 'Acme Corp.',
		logo: AudioWaveform,
		plan: 'Startup',
	},
	{
		name: 'Evil Corp.',
		logo: Command,
		plan: 'Free',
	},
];

export function AppSidebar() {
	const { user, isOwner, isEmployee, isManager } = useUser();
	const navUser = {
		name: user ? user.full_name : '',
		email: user ? user.email : '',
		avatar: 'https://i.pinimg.com/736x/5d/df/7f/5ddf7f72c2c0d387f0d1985154b171f5.jpg',
	};
	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader>
				<TeamSwitcher teams={teams} />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{data.map((item) => (
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
											<UserSearch />
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
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={navUser} />
			</SidebarFooter>
		</Sidebar>
	);
}
