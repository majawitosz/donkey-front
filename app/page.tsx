/** @format */

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { ModeToggle } from '@/components/ui/theme-toggler';

export default function Home() {
	return (
		<div>
			<ModeToggle />
			<div className='flex w-full justify-center min-h-screen items-center'>
				<Card className='w-full max-w-sm h-1/2'>
					<CardHeader>
						<CardTitle>Welcome to DoneKey</CardTitle>
						<CardDescription>Choose your path</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col justify-between gap-5'>
							<Button className='w-full' asChild>
								<Link href='/login'>Sign Up Your Buisness</Link>
							</Button>
							<Button className='w-full' asChild>
								<Link href='/login'>Sign Up as Worker</Link>
							</Button>
							<Button
								variant='outline'
								className='w-full'
								asChild>
								<Link href='/login'>Login</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
