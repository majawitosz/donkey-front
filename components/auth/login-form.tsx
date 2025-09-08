/** @format */
'use client';
import { Button } from '../ui/button';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardAction,
	CardContent,
	CardFooter,
} from '../ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '../ui/input';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Credentials } from '@/lib/definitions/user';
import { authenticate } from '@/lib/actions';
import { useActionState } from 'react';

export default function Login() {
	const [errorMessage, formAction, isPending] = useActionState(
		authenticate,
		undefined
	);
	const form = useForm<Credentials>({
		defaultValues: {
			email: '',
			password: '',
		},
	});

	return (
		<Form {...form}>
			<form
				action={formAction}
				className='flex w-full justify-center min-h-screen items-center'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle>Login to your account</CardTitle>
						<CardDescription>
							Enter your email below to login to your account
						</CardDescription>
						<CardAction>
							<Button variant='link'>
								<Link href='/'>Sign Up</Link>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<FormField
									control={form.control}
									name='email'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													placeholder='m@example.com'
													required
													type='email'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className='grid gap-2'>
								<FormField
									control={form.control}
									name='password'
									render={({ field }) => (
										<FormItem>
											<div className='flex items-center'>
												<FormLabel>Password</FormLabel>
												<a
													href='#'
													className='ml-auto inline-block text-sm underline-offset-4 hover:underline'>
													Forgot your password?
												</a>
											</div>
											<FormControl>
												<Input
													placeholder='********'
													type='password'
													required
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</CardContent>
					<CardFooter className='flex-col gap-2'>
						<Button
							type='submit'
							className='w-full'
							aria-disabled={isPending}>
							Login
						</Button>
						{errorMessage && (
							<>
								<p className='text-sm text-red-500'>
									{errorMessage}
								</p>
							</>
						)}
						<Button variant='outline' className='w-full'>
							Login with Google
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
