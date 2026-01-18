/** @format */

'use client';

import * as React from 'react';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { Link } from '@/i18n/navigation';

export function LocationSwitcher({
	locations,
	isOwner,
}: {
	locations: string[];
	isOwner: boolean;
}) {
	const { isMobile } = useSidebar();
	const [activeLocation, setActiveLocation] = useState(locations[0]);

	React.useEffect(() => {
		if (locations.length > 0) {
			setActiveLocation(locations[0]);
		}
	}, [locations]);

	if (!activeLocation) {
		return null;
	}

	const getInitials = (name: string) => {
		return name
			? name
					.split(' ')
					.map((n) => n[0])
					.join('')
					.toUpperCase()
					.slice(0, 2)
			: '';
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size='lg'
							className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
							<div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center  justify-center rounded-lg'>
								<Avatar className='h-8 w-8 rounded-lg'>
									<AvatarFallback className='rounded-lg flex h-full w-full items-center justify-center'>
										{getInitials(activeLocation)}
									</AvatarFallback>
								</Avatar>
							</div>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-medium'>
									{activeLocation}
								</span>
							</div>
							<ChevronsUpDown className='ml-auto' />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
						align='start'
						side={isMobile ? 'bottom' : 'right'}
						sideOffset={4}>
						<DropdownMenuLabel className='text-muted-foreground text-xs'>
							Locations
						</DropdownMenuLabel>
						{locations.map((location, index) => (
							<DropdownMenuItem
								key={location}
								onClick={() => setActiveLocation(location)}
								className='gap-2 p-2'>
								<div className='flex size-6 items-center justify-center rounded-md border'>
									<span className='text-xs'>
										{getInitials(location)}
									</span>
								</div>
								{location}
							</DropdownMenuItem>
						))}
						{isOwner && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem className='gap-2 p-2' asChild>
									<Link href='/dashboard/admin/new-location'>
										<div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
											<Plus className='size-4' />
										</div>
										<div className='text-muted-foreground font-medium'>
											Add location
										</div>
									</Link>
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
