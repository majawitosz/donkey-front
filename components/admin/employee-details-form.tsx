/** @format */

'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { updateEmployee } from '@/lib/actions';
import { useAlert } from '@/providers/alert-provider';
import type { components } from '@/lib/types/openapi';
import { useRouter } from 'next/navigation';

type EmployeeDetail = components['schemas']['UserDetail'];
type Position = components['schemas']['Position'];

const formSchema = z.object({
	first_name: z.string().min(1),
	last_name: z.string().min(1),
	email: z.string().email(),
	role: z.enum(['owner', 'manager', 'employee']),
	position_id: z.string().optional(),
	experience_years: z.coerce.number().min(0).optional(),
	notes: z.string().optional(),
	is_active: z.boolean().optional(),
	is_staff: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployeeDetailsFormProps {
	employee: EmployeeDetail;
	positions: Position[];
}

export function EmployeeDetailsForm({
	employee,
	positions,
}: EmployeeDetailsFormProps) {
	const t = useTranslations('EmployeeDetails');
	const { showAlert } = useAlert();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<FormValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			first_name: employee.first_name,
			last_name: employee.last_name,
			email: employee.email,
			role: employee.role,
			position_id: employee.position_id?.toString() || undefined,
			experience_years: employee.experience_years,
			notes: employee.notes || '',
			is_active: employee.is_active,
			is_staff: employee.is_staff,
		},
	});

	async function onSubmit(data: FormValues) {
		setIsLoading(true);
		try {
			const updateData = {
				...data,
				position_id: data.position_id
					? parseInt(data.position_id)
					: null,
			};
			await updateEmployee(employee.id, updateData);
			showAlert({
				title: 'Sukces!',
				description: t('successMessage'),
				variant: 'success',
			});
			router.refresh();
		} catch (error) {
			console.error(error);
			showAlert({
				title: 'Błąd',
				description: t('errorMessage'),
				variant: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle>{t('personalInfo')}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<FormField
								control={form.control}
								name='first_name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('firstName')}</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='last_name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('lastName')}</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('email')}</FormLabel>
									<FormControl>
										<Input {...field} type='email' />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t('roleAndPosition')}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<FormField
							control={form.control}
							name='role'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('role')}</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														'selectRole',
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value='owner'>
												{t('roles.owner')}
											</SelectItem>
											<SelectItem value='manager'>
												{t('roles.manager')}
											</SelectItem>
											<SelectItem value='employee'>
												{t('roles.employee')}
											</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										{t('roleDescription')}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='position_id'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('position')}</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														'selectPosition',
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{positions.map((pos) => (
												<SelectItem
													key={pos.id}
													value={pos.id.toString()}>
													{pos.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='experience_years'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t('experienceYears')}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											type='number'
											min='0'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t('settings')}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<FormField
							control={form.control}
							name='is_active'
							render={({ field }) => (
								<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
									<div className='space-y-0.5'>
										<FormLabel className='text-base'>
											{t('isActive')}
										</FormLabel>
										<FormDescription>
											{t('isActiveDescription')}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='notes'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('notes')}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t('notesPlaceholder')}
											className='resize-none'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Button type='submit' disabled={isLoading}>
					{isLoading ? t('saving') : t('saveChanges')}
				</Button>
			</form>
		</Form>
	);
}
