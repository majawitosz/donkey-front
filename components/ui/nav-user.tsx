/** @format */

'use client';

import { LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { signOutUser } from '@/lib/actions';

export function NavUser({
	user,
}: {
	user: {
		name: string;
		surname?: string;
		email: string;
		avatar?: string;
	};
}) {
	const initials =
		user.name && user.surname
			? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
			: user.name
				? user.name.slice(0, 2).toUpperCase()
				: 'U';

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<form action={signOutUser}>
					<SidebarMenuButton
						size='lg'
						type='submit'
						className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
						<Avatar className='h-8 w-8 rounded-lg'>
							<AvatarImage
								src={user.avatar}
								alt={`${user.name} ${user.surname || ''}`}
							/>
							<AvatarFallback className='rounded-lg'>
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className='grid flex-1 text-left text-sm leading-tight'>
							<span className='truncate font-medium'>
								{user.name} {user.surname}
							</span>
							<span className='truncate text-xs'>
								{user.email}
							</span>
						</div>
						<LogOut className='ml-auto size-4' />
					</SidebarMenuButton>
				</form>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
