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
import { Input } from '../ui/input';
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from '@/components/ui/tooltip';
import { Link, useRouter } from '@/i18n/navigation';
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
import { useAlert } from '@/providers/alert-provider';
import { useTranslations } from 'next-intl';

export default function SignUpWorkerForm() {
	const t = useTranslations('Auth');
	const router = useRouter();
	const { showAlert } = useAlert();

	const formSchema = z.object({
		first_name: z
			.string()
			.min(2, { message: t('validation.minLength') })
			.max(50, { message: t('validation.maxLength') }),
		last_name: z
			.string()
			.min(2, { message: t('validation.minLength') })
			.max(50, { message: t('validation.maxLength') }),
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
		company_code: z.string().min(2, {
			message: t('validation.companyCodeLength'),
		}),
	});

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
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/accounts/register`,
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
					// @ts-ignore
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
						<CardTitle>{t('signup.workerTitle')}</CardTitle>
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
									name='first_name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t('signup.firstName')}
											</FormLabel>
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
											<FormLabel>
												{t('signup.lastName')}
											</FormLabel>
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
							<div className='grid gap-2'>
								<FormField
									control={form.control}
									name='company_code'
									render={({ field }) => (
										<FormItem>
											<div className='flex items-center'>
												<FormLabel>
													{t('signup.companyCode')}
												</FormLabel>
												<Tooltip>
													<TooltipTrigger asChild>
														<p className='ml-auto inline-block text-sm underline-offset-4 hover:underline'>
															{t(
																'signup.howToGetCode'
															)}
														</p>
													</TooltipTrigger>
													<TooltipContent>
														<p>
															{t(
																'signup.contactOwner'
															)}
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
