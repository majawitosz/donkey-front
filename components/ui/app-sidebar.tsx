/** @format */
'use client';

import {
	Calendar,
	Home,
	UserSearch,
	IdCardLanyard,
	CalendarCog,
	CalendarPlus,
	CalendarRange,
	Clock,
	Settings,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useUser } from '@/providers/user-provider';
import { LocationSwitcher } from './team-switcher';
import { NavUser } from './nav-user';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function AppSidebar() {
	const t = useTranslations('Sidebar');
	const {
		user,
		isOwner,
		isManager,
		locations,
		selectedLocation,
		setSelectedLocation,
	} = useUser();
	const navUser = {
		name: user ? user.first_name : '',
		surname: user ? user.last_name : '',
		email: user ? user.email : '',
	};

	const locationNames =
		locations.length > 0 ? locations.map((l) => l.name) : [];

	const handleLocationSelect = (name: string) => {
		const loc = locations.find((l) => l.name === name);
		if (loc) {
			setSelectedLocation(loc);
		}
	};

	const data = [
		{
			title: t('home'),
			url: '/dashboard',
			icon: Home,
			isVisible: true,
		},
		{
			title: t('positions'),
			url: '/dashboard/admin/positions',
			icon: IdCardLanyard,
			isVisible: isOwner,
		},
		{
			title: t('availability'),
			url: '/dashboard/admin/availability',
			icon: Calendar,
			isVisible: isOwner || isManager,
		},
		{
			title: t('demand'),
			url: '/dashboard/admin/demand',
			icon: CalendarCog,
			isVisible: isOwner,
		},
		{
			title: t('schedule'),
			url: '/dashboard/admin/schedule',
			icon: CalendarPlus,
			isVisible: isOwner || isManager,
		},
		{
			title: t('calendars'),
			url: '/dashboard/admin/calendars',
			icon: CalendarRange,
			isVisible: isOwner || isManager,
		},
		{
			title: t('attendance'),
			url: '/dashboard/attendance',
			icon: Clock,
			isVisible: isOwner,
		},
		{
			title: t('employees'),
			url: '/dashboard/admin/employees',
			icon: UserSearch,
			isVisible: isOwner,
		},
		{
			title: t('settings'),
			url: '/dashboard/admin/settings',
			icon: Settings,
			isVisible: isOwner,
		},
	];

	const visibleData = data.filter((item) => item.isVisible);

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader>
				<LocationSwitcher
					locations={locationNames}
					isOwner={isOwner}
					selectedLocation={
						selectedLocation
							? selectedLocation.name
							: locations[0]?.name
					}
					onLocationSelect={handleLocationSelect}
				/>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{visibleData.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
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
