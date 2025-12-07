/** @format */

'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
	const router = useRouter();
	const pathname = usePathname();

	const handleLanguageChange = (locale: string) => {
		router.replace(pathname, { locale });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='icon'>
					<Globe className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all' />
					<span className='sr-only'>Toggle language</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => handleLanguageChange('en')}>
					English
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleLanguageChange('pl')}>
					Polski
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
