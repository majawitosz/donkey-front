/** @format */
'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from './theme-toggler';
import { LanguageSwitcher } from './language-switcher';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function SiteHeader() {
	const pathname = usePathname();
	const t = useTranslations('Sidebar');

	const getTitle = () => {
		if (pathname === '/dashboard') return t('home');
		if (pathname.includes('/admin/positions')) return t('positions');
		if (pathname.includes('/admin/availability')) return t('availability');
		if (pathname.includes('/admin/demand')) return t('demand');
		if (pathname.includes('/admin/schedule')) return t('schedule');
		if (pathname.includes('/admin/calendars')) return t('calendars');
		if (pathname.includes('/admin/employees')) return t('employees');
		if (pathname.includes('/worker')) return t('workerPanel');

		return 'DoneKey';
	};

	return (
		<header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
			<div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
				<SidebarTrigger className='-ml-1' />
				<Separator
					orientation='vertical'
					className='mx-2 data-[orientation=vertical]:h-4'
				/>
				<h1 className='text-base font-medium'>{getTitle()}</h1>
				<div className='ml-auto flex items-center gap-2'>
					<LanguageSwitcher />
					<ModeToggle />
				</div>
			</div>
		</header>
	);
}
