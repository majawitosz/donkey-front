/** @format */
'use client';

import { ModeToggle } from './theme-toggler';
import { LanguageSwitcher } from './language-switcher';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import LogoLight from '@/public/logo-light.svg';
import LogoDark from '@/public/logo-dark.svg';

export function PublicHeader() {
	return (
		<header className='flex h-16 items-center justify-between border-b px-6 bg-background'>
			<div className='relative'>
				<Link href='/'>
					<Image
						src={LogoLight}
						alt='Logo'
						width={150}
						className='dark:hidden'
					/>
					<Image
						src={LogoDark}
						alt='Logo'
						width={150}
						className='hidden dark:block'
					/>
				</Link>
			</div>
			<div className='flex items-center gap-2'>
				<LanguageSwitcher />
				<ModeToggle />
			</div>
		</header>
	);
}
