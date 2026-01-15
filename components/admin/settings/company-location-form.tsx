/** @format */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { saveWorkplaceConfig, WorkplaceConfig } from '@/lib/actions';
import { Loader2, Save } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

const LocationPickerMap = dynamic(() => import('./location-picker-map'), {
	ssr: false,
	loading: () => <Skeleton className='h-[400px] w-full rounded-lg' />,
});

const formSchema = z.object({
	latitude: z.coerce.number().min(-90).max(90),
	longitude: z.coerce.number().min(-180).max(180),
	radius: z.coerce.number().min(1, 'Radius must be at least 1 meter'),
});

interface CompanyLocationFormProps {
	initialConfig: WorkplaceConfig | null;
}

export default function CompanyLocationForm({
	initialConfig,
}: CompanyLocationFormProps) {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			latitude: initialConfig?.latitude || 52.2297,
			longitude: initialConfig?.longitude || 21.0122,
			radius: initialConfig?.radius || 100,
		},
	});

	const { setValue, watch } = form;
	const latitude = watch('latitude');
	const longitude = watch('longitude');
	const radius = watch('radius');

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setLoading(true);
		setSuccess(false);
		try {
			await saveWorkplaceConfig(values);
			setSuccess(true);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}

	const handleLocationSelect = (lat: number, lng: number) => {
		setValue('latitude', parseFloat(lat.toFixed(6)));
		setValue('longitude', parseFloat(lng.toFixed(6)));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Workplace Location</CardTitle>
				<CardDescription>
					Define the central point and radius for employee attendance
					check-ins.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='grid gap-6 md:grid-cols-2'>
					<div className='space-y-4'>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className='space-y-4'>
								<FormField
									control={form.control}
									name='latitude'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Latitude</FormLabel>
											<FormControl>
												<Input
													type='number'
													step='any'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='longitude'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Longitude</FormLabel>
											<FormControl>
												<Input
													type='number'
													step='any'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='radius'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Radius (meters)
											</FormLabel>
											<FormControl>
												<Input
													type='number'
													{...field}
												/>
											</FormControl>
											<FormDescription>
												The allowed distance from the
												center point.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button type='submit' disabled={loading}>
									{loading ? (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									) : (
										<Save className='mr-2 h-4 w-4' />
									)}
									Save Configuration
								</Button>
								{success && (
									<p className='text-sm text-green-600 mt-2'>
										Configuration saved successfully!
									</p>
								)}
							</form>
						</Form>
					</div>
					<div>
						<LocationPickerMap
							latitude={latitude}
							longitude={longitude}
							radius={radius}
							onLocationSelect={handleLocationSelect}
						/>
						<p className='text-xs text-muted-foreground mt-2 text-center'>
							Click on the map to update coordinates.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
