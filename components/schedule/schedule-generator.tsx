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
import type { components } from '@/lib/types/openapi';
import WeeklyScheduleView from './weekly-schedule-view';

type GenerateResultOut = components['schemas']['GenerateResultOut'];

export default function ScheduleGenerator() {
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

	const handlePreviousWeek = () => {
		setCurrentWeekStart((prev) => subWeeks(prev, 1));
		setGeneratedSchedule(null); // Wyczyść poprzedni grafik
	};

	const handleNextWeek = () => {
		setCurrentWeekStart((prev) => addWeeks(prev, 1));
		setGeneratedSchedule(null); // Wyczyść poprzedni grafik
	};

	const handleCurrentWeek = () => {
		setCurrentWeekStart(
			startOfWeek(new Date(), { locale: pl, weekStartsOn: 1 })
		);
		setGeneratedSchedule(null); // Wyczyść poprzedni grafik
	};

	const handleGenerateSchedule = async () => {
		setLoading(true);
		try {
			const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
			const dateTo = format(currentWeekEnd, 'yyyy-MM-dd');

			const result = await generateSchedule(dateFrom, dateTo);

			setGeneratedSchedule(result);
			showAlert({
				title: 'Sukces!',
				description: `Wygenerowano grafik dla ${result.assignments.length} zmian.`,
				variant: 'success',
			});

			console.log('✅ Schedule generated:', result);
		} catch (error) {
			console.error('❌ Error generating schedule:', error);
			showAlert({
				title: 'Błąd',
				description:
					error instanceof Error
						? error.message
						: 'Nie udało się wygenerować grafiku',
				variant: 'error',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Card>
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
								onClick={handleGenerateSchedule}
								disabled={loading}>
								{loading && (
									<Spinner className='mr-2 h-4 w-4' />
								)}
								<Calendar className='mr-2 h-4 w-4' />
								Generuj grafik
							</Button>
						</div>
					</div>

					{loading ? (
						<div className='flex flex-col items-center justify-center py-12 gap-4'>
							<Spinner className='h-8 w-8' />
							<p className='text-muted-foreground'>
								Generowanie grafiku...
							</p>
						</div>
					) : generatedSchedule ? (
						<WeeklyScheduleView
							weekStart={currentWeekStart}
							scheduleData={generatedSchedule}
						/>
					) : (
						<div className='flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground'>
							<Calendar className='h-12 w-12 opacity-50' />
							<p>
								Wybierz tydzień i kliknij &quot;Generuj
								grafik&quot;
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
