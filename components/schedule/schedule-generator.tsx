/** @format */
'use client';
import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { generateSchedule } from '@/lib/actions';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAlert } from '@/providers/alert-provider';
import { useUser } from '@/providers/user-provider';
import type { components } from '@/lib/types/openapi';
import WeeklyScheduleView from './weekly-schedule-view';

type GenerateResultOut = components['schemas']['GenerateResultOut'];

export default function ScheduleGenerator() {
	const { selectedLocation } = useUser();
	const { showAlert } = useAlert();
	const [loading, setLoading] = React.useState(false);
	const [currentWeekStart, setCurrentWeekStart] = React.useState<Date>(() =>
		startOfWeek(new Date(), { locale: pl, weekStartsOn: 1 })
	);
	const [generatedSchedule, setGeneratedSchedule] =
		React.useState<GenerateResultOut | null>(null);

	const currentWeekEnd = endOfWeek(currentWeekStart, {
		locale: pl,
		weekStartsOn: 1,
	});

	// Automatycznie ładuj grafik przy montowaniu i zmianie tygodnia
	React.useEffect(() => {
		const loadSchedule = async () => {
			if (!selectedLocation) return;
			setLoading(true);
			try {
				const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
				const dateTo = format(currentWeekEnd, 'yyyy-MM-dd');

				// force: false - tylko załaduj istniejący grafik
				const result = await generateSchedule(
					dateFrom,
					dateTo,
					selectedLocation.id.toString(),
					false
				);

				setGeneratedSchedule(result);
				console.log('✅ Schedule loaded:', result);
			} catch (error) {
				console.error('❌ Error loading schedule:', error);
				showAlert({
					title: 'Błąd',
					description:
						error instanceof Error
							? error.message
							: 'Nie udało się załadować grafiku',
					variant: 'error',
				});
			} finally {
				setLoading(false);
			}
		};

		loadSchedule();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentWeekStart, selectedLocation]); // Reaguj tylko na zmianę tygodnia

	// Funkcja do odświeżania grafiku (dla edycji)
	const refreshSchedule = React.useCallback(async () => {
		if (!selectedLocation) return;
		setLoading(true);
		try {
			const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
			const dateTo = format(currentWeekEnd, 'yyyy-MM-dd');

			// force: false - tylko załaduj istniejący grafik
			const result = await generateSchedule(
				dateFrom,
				dateTo,
				selectedLocation.id.toString(),
				false
			);

			setGeneratedSchedule(result);
			console.log('✅ Schedule refreshed:', result);
		} catch (error) {
			console.error('❌ Error refreshing schedule:', error);
		} finally {
			setLoading(false);
		}
	}, [currentWeekStart, currentWeekEnd, selectedLocation]);

	// Funkcja do regenerowania grafiku (force: true)
	const regenerateSchedule = React.useCallback(async () => {
		if (!selectedLocation) {
			showAlert({
				title: 'Błąd',
				description: 'Wybierz lokalizację',
				variant: 'error',
			});
			return;
		}

		setLoading(true);
		try {
			const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
			const dateTo = format(currentWeekEnd, 'yyyy-MM-dd');

			// force: true - wygeneruj ponownie od zera
			const result = await generateSchedule(
				dateFrom,
				dateTo,
				selectedLocation.id.toString(),
				true
			);

			setGeneratedSchedule(result);
			showAlert({
				title: 'Sukces',
				description: 'Grafik został wygenerowany ponownie',
				variant: 'success',
			});
			console.log('✅ Schedule regenerated:', result);
		} catch (error) {
			console.error('❌ Error regenerating schedule:', error);
			showAlert({
				title: 'Błąd',
				description:
					error instanceof Error
						? error.message
						: 'Nie udało się wygenerować grafiku ponownie',
				variant: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, [currentWeekStart, currentWeekEnd, showAlert]);

	const handlePreviousWeek = () => {
		setCurrentWeekStart((prev) => subWeeks(prev, 1));
	};

	const handleNextWeek = () => {
		setCurrentWeekStart((prev) => addWeeks(prev, 1));
	};

	const handleCurrentWeek = () => {
		setCurrentWeekStart(
			startOfWeek(new Date(), { locale: pl, weekStartsOn: 1 })
		);
	};

	return (
		<>
			<Card className='w-[80%] lg:w-3/4'>
				<CardHeader>
					<CardTitle>Generator grafików</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='mb-6 flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Button
								variant='outline'
								size='icon'
								onClick={handlePreviousWeek}
								disabled={loading}>
								<ChevronLeft className='h-4 w-4' />
							</Button>
							<div className='min-w-[280px] text-center'>
								<p className='text-sm font-medium'>
									{format(currentWeekStart, 'd MMMM yyyy', {
										locale: pl,
									})}{' '}
									-{' '}
									{format(currentWeekEnd, 'd MMMM yyyy', {
										locale: pl,
									})}
								</p>
								<p className='text-xs text-muted-foreground'>
									Tydzień{' '}
									{format(currentWeekStart, 'w', {
										locale: pl,
									})}
								</p>
							</div>
							<Button
								variant='outline'
								size='icon'
								onClick={handleNextWeek}
								disabled={loading}>
								<ChevronRight className='h-4 w-4' />
							</Button>
						</div>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								onClick={handleCurrentWeek}
								disabled={loading}>
								Obecny tydzień
							</Button>
							<Button
								onClick={regenerateSchedule}
								disabled={loading}>
								Generuj ponownie
							</Button>
						</div>
					</div>

					{loading ? (
						<div className='flex flex-col items-center justify-center py-12 gap-4'>
							<Spinner className='h-8 w-8' />
							<p className='text-muted-foreground'>
								Ładowanie grafiku...
							</p>
						</div>
					) : generatedSchedule ? (
						<WeeklyScheduleView
							weekStart={currentWeekStart}
							scheduleData={generatedSchedule}
							onScheduleUpdate={refreshSchedule}
						/>
					) : null}
				</CardContent>
			</Card>
		</>
	);
}
