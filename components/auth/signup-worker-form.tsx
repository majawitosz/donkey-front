/** @format */
'use client';
import { Label } from '@/components/ui/label';
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
import { Input } from '../ui/input';
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
	first_name: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
	last_name: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
	email: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
	password: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
	company_code: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
});

export default function SignUpWorkerForm() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			first_name: '',
			last_name: '',
			password: '',
			company_code: '',
		},
	});
	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/register`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(values),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || 'Something went wrong');
			}

			const data = await response.json();
			console.log('Registered:', data);
			return data;
		} catch (err) {
			console.error('Register failed:', err);
			throw err;
		}
	}
	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='flex w-full justify-center min-h-screen items-center'>
				<Card className='w-full max-w-lg'>
					<CardHeader>
						<CardTitle>Sign Up as a Worker</CardTitle>
						<CardDescription>
							Enter your data below to sign up
						</CardDescription>
						<CardAction>
							<Button variant='link'>
								<Link href='/login'>
									Already have an account
								</Link>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<FormField
									control={form.control}
									name='first_name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input
													placeholder='John'
													required
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
									name='last_name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last Name</FormLabel>
											<FormControl>
												<Input
													placeholder='Doe'
													required
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
									name='email'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													placeholder='m@example.com'
													type='email'
													required
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
											<FormLabel>Password</FormLabel>
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
							<div className='grid gap-2'>
								<FormField
									control={form.control}
									name='company_code'
									render={({ field }) => (
										<FormItem>
											<div className='flex items-center'>
												<FormLabel>
													Company Code
												</FormLabel>
												<Tooltip>
													<TooltipTrigger asChild>
														<p className='ml-auto inline-block text-sm underline-offset-4 hover:underline'>
															How do I get a
															company code?
														</p>
													</TooltipTrigger>
													<TooltipContent>
														<p>
															Contact your company
															owner
														</p>
													</TooltipContent>
												</Tooltip>
											</div>
											<FormControl>
												<Input
													placeholder='12345678'
													type='text'
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
						<Button type='submit' className='w-full'>
							Sign Up
						</Button>
						<Button variant='outline' className='w-full'>
							Sign Up with Google
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
