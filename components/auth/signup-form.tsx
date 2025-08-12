/** @format */

import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardAction,
	CardContent,
	CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SignUpForm() {
	return (
		<div className='flex w-full justify-center min-h-screen items-center'>
			<Card className='w-full max-w-lg'>
				<CardHeader>
					<CardTitle>Sign Up Your Buisness</CardTitle>
					<CardDescription>
						Enter your data below to sign up
					</CardDescription>
					<CardAction>
						<Button variant='link'>
							<Link href='/login'>Already have an account</Link>
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					<form>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='company-name'>
									Company Name
								</Label>
								<Input
									id='company-name'
									type='text'
									placeholder='My Company'
									required
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='name'>First Name</Label>
								<Input
									id='name'
									type='text'
									placeholder='John'
									required
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='last-name'>Last Name</Label>

								<Input
									id='last-name'
									type='text'
									placeholder='Doe'
									required
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='nip'>NIP</Label>

								<Input
									id='nip'
									type='text'
									placeholder='12345678901'
									required
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									type='email'
									placeholder='m@example.com'
									required
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='password'>Password</Label>
								<Input
									id='password'
									type='password'
									placeholder='********'
									required
								/>
							</div>
						</div>
					</form>
				</CardContent>
				<CardFooter className='flex-col gap-2'>
					<Button type='submit' className='w-full'>
						Sign Up
					</Button>
					<Button variant='outline' className='w-full'>
						Sign Up with Google
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
