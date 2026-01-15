/** @format */

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { PublicHeader } from '@/components/ui/public-header';
import { useTranslations } from 'next-intl';

export default function Home() {
	const t = useTranslations('Home');
	//const tCommon = useTranslations('Common');

	return (
		<div className='flex min-h-screen flex-col'>
			<PublicHeader />
			<div className='flex w-full justify-center flex-1 items-center'>
				<Card className='w-full max-w-sm h-1/2'>
					<CardHeader>
						<CardTitle>{t('welcome')}</CardTitle>
						<CardDescription>{t('chooseWay')}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col justify-between gap-5'>
							<Button className='w-full' asChild>
								<Link href='/signup'>
									{t('signUpBusiness')}
								</Link>
							</Button>
							<Button className='w-full' asChild>
								<Link href='/signup-worker'>
									{t('signUpWorker')}
								</Link>
							</Button>
							<Button
								variant='outline'
								className='w-full'
								asChild>
								<Link href='/login'>{t('login')}</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
