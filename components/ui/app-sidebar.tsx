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
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

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
	const t = useTranslations('Sidebar');
	const { user, isOwner, isEmployee, isManager } = useUser();
	const navUser = {
		name: user ? user.full_name : '',
		email: user ? user.email : '',
		avatar: 'https://i.pinimg.com/736x/5d/df/7f/5ddf7f72c2c0d387f0d1985154b171f5.jpg',
	};

	const data = [
		{
			title: t('home'),
			url: '/dashboard',
			icon: Home,
		},
		{
			title: t('positions'),
			url: '/dashboard/admin/positions',
			icon: IdCardLanyard,
		},
		{
			title: t('availability'),
			url: '/dashboard/admin/availability',
			icon: Calendar,
		},
		{
			title: t('demand'),
			url: '/dashboard/admin/demand',
			icon: CalendarCog,
		},
		{
			title: t('schedule'),
			url: '/dashboard/admin/schedule',
			icon: CalendarPlus,
		},
		{
			title: t('calendars'),
			url: '/dashboard/admin/calendars',
			icon: CalendarRange,
		},
	];

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader>
				<TeamSwitcher teams={teams} />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>{t('application')}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{data.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}

							{isOwner && (
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<Link href='/dashboard/admin/employees'>
											<UserSearch />
											<span>{t('employees')}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
							{isEmployee && (
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<Link href='/worker'>
											<User2 />
											<span>{t('workerPanel')}</span>
										</Link>
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
