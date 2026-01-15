/** @format */
'use client';
import { Link, useRouter } from '@/i18n/navigation';
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
import { useTranslations } from 'next-intl';

export default function SignUpForm() {
	const t = useTranslations('Auth');
	const router = useRouter();

	const formSchema = z.object({
		company_name: z
			.string()
			.min(2, { message: t('validation.minLength') })
			.max(100, { message: t('validation.maxLength') }),

		first_name: z
			.string()
			.min(2, { message: t('validation.minLength') })
			.max(50, { message: t('validation.maxLength') }),

		last_name: z
			.string()
			.min(2, { message: t('validation.minLength') })
			.max(50, { message: t('validation.maxLength') }),

		nip: z
			.string()
			.regex(/^[0-9]{10}$/, { message: t('validation.nipLength') }),

		email: z.email({ message: t('validation.emailInvalid') }),

		password: z
			.string()
			.min(8, { message: t('validation.passwordLength') })
			.regex(/[A-Z]/, {
				message: t('validation.passwordUppercase'),
			})
			.regex(/[0-9]/, { message: t('validation.passwordNumber') })
			.regex(/[@$!%*?&]/, {
				message: t('validation.passwordSpecial'),
			}),
	});

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
					// @ts-expect-error -- handling server side validation errors dynamically
					form.setError(field, {
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
				className='flex w-full justify-center flex-1 items-center'>
				<Card className='w-full max-w-lg'>
					<CardHeader>
						<CardTitle>{t('signup.businessTitle')}</CardTitle>
						<CardDescription>
							{t('signup.description')}
						</CardDescription>
						<CardAction>
							<Button variant='link'>
								<Link href='/login'>
									{t('signup.alreadyHaveAccount')}
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
											<FormLabel>
												{t('signup.companyName')}
											</FormLabel>
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
											<FormLabel>
												{t('signup.firstName')}
											</FormLabel>
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
											<FormLabel>
												{t('signup.lastName')}
											</FormLabel>
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
											<FormLabel>
												{t('signup.nip')}
											</FormLabel>
											<FormControl>
												<Input
													placeholder='12345678901'
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
									name='email'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t('signup.email')}
											</FormLabel>
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
											<FormLabel>
												{t('signup.password')}
											</FormLabel>
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
							{t('signup.submit')}
						</Button>
						<Button variant='outline' className='w-full'>
							{t('signup.google')}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
