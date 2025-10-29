/** @format */
'use client';
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/providers/alert-provider';

const formSchema = z.object({
	company_name: z
		.string()
		.min(2, { message: 'Company name must be at least 2 characters.' })
		.max(100, { message: 'Company name too long.' }),

	first_name: z
		.string()
		.min(2, { message: 'First name must be at least 2 characters.' })
		.max(50, { message: 'Name too long.' }),

	last_name: z
		.string()
		.min(2, { message: 'Last name must be at least 2 characters.' })
		.max(50, { message: 'Last name too long.' }),

	nip: z
		.string()
		.regex(/^[0-9]{10}$/, { message: 'NIP must be exactly 10 digits.' }),

	email: z.email({ message: 'Invalid email address.' }),

	password: z
		.string()
		.min(8, { message: 'Password must be at least 8 characters.' })
		.regex(/[A-Z]/, {
			message: 'Password must contain at least 1 uppercase letter.',
		})
		.regex(/[0-9]/, { message: 'Password must contain at least 1 number.' })
		.regex(/[@$!%*?&]/, {
			message:
				'Password must contain at least 1 special character (@$!%*?&).',
		}),
});

export default function SignUpForm() {
	const router = useRouter();
	const { showAlert } = useAlert();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			company_name: '',
			first_name: '',
			last_name: '',
			nip: '',
			email: '',
			password: '',
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/accounts/register-company`,
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
			Object.entries(errorData).forEach(([field, messages]) => {
				if (Array.isArray(messages)) {
					form.setError(field as keyof z.infer<typeof formSchema>, {
						type: 'server',
						message: messages.join(', '),
					});
				}
			});
		}

		await response.json();
		router.push(`/login?email=${encodeURIComponent(values.email)}`);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='flex w-full justify-center min-h-screen items-center'>
				<Card className='w-full max-w-lg'>
					<CardHeader>
						<CardTitle>Sign Up Your Buisness</CardTitle>
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
									name='company_name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Company Name</FormLabel>
											<FormControl>
												<Input
													placeholder='My Company'
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
									name='first_name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input
													placeholder='John'
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
							<div className='grid gap-2'>
								<FormField
									control={form.control}
									name='nip'
									render={({ field }) => (
										<FormItem>
											<FormLabel>NIP</FormLabel>
											<FormControl>
												<Input
													placeholder='12345678901'
													type='number'
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
