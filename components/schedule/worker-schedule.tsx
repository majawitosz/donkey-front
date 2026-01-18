/** @format */
'use client';

import * as React from 'react';
import {
	format,
	startOfWeek,
	endOfWeek,
	addWeeks,
	subWeeks,
	addDays,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { generateSchedule } from '@/lib/actions';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAlert } from '@/providers/alert-provider';
import { useUser } from '@/providers/user-provider';
import type { components } from '@/lib/types/openapi';

type GenerateResultOut = components['schemas']['GenerateResultOut'];
type ScheduleShiftOut = components['schemas']['ScheduleShiftOut'];

const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_HEIGHT = 60; // Increased height for better visibility

const generateHours = () => {
	const hours: number[] = [];
	for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
		hours.push(hour);
	}
	return hours;
};

const hours = generateHours();

const timeToPixels = (time: string): number => {
	const [h, m] = time.split(':').map(Number);
	const totalMinutes = (h - START_HOUR) * 60 + m;
	return (totalMinutes / 60) * HOUR_HEIGHT;
};

export default function WorkerWeeklyScheduleView() {
	const { user, selectedLocation } = useUser();
	const { showAlert } = useAlert();
	const [loading, setLoading] = React.useState(false);
	const [currentWeekStart, setCurrentWeekStart] = React.useState<Date>(() =>
		startOfWeek(new Date(), { locale: pl, weekStartsOn: 1 }),
	);
	const [scheduleData, setScheduleData] =
		React.useState<GenerateResultOut | null>(null);

	const currentWeekEnd = endOfWeek(currentWeekStart, {
		locale: pl,
		weekStartsOn: 1,
	});

	React.useEffect(() => {
		const loadSchedule = async () => {
			if (!selectedLocation) return;
			setLoading(true);
			try {
				const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
				const dateTo = format(currentWeekEnd, 'yyyy-MM-dd');
				const result = await generateSchedule(
					dateFrom,
					dateTo,
					selectedLocation.id.toString(),
					false,
					false, // persist=false prevents saving/generating if defaults missing?
				);

				setScheduleData(result);
			} catch (error) {
				console.error('Error loading schedule:', error);
				const isBadRequest =
					error instanceof Error &&
					(error.message.includes('400') ||
						error.message.includes(
							'Brak domyślnego zapotrzebowania',
						));

				if (!isBadRequest) {
					showAlert({
						title: 'Błąd',
						description: 'Nie udało się załadować grafiku',
						variant: 'error',
					});
				}
			} finally {
				setLoading(false);
			}
		};

		loadSchedule();
	}, [currentWeekStart, selectedLocation, showAlert]);

	const previousWeek = () => setCurrentWeekStart((d) => subWeeks(d, 1));
	const nextWeek = () => setCurrentWeekStart((d) => addWeeks(d, 1));

	const weekDays = Array.from({ length: 7 }, (_, i) =>
		addDays(currentWeekStart, i),
	);

	const getMyShiftsForDay = (date: Date): ScheduleShiftOut[] => {
		if (!scheduleData || !user) return [];
		const dateStr = format(date, 'yyyy-MM-dd');

		return scheduleData.assignments.filter((shift) => {
			if (shift.date !== dateStr) return false;

			// Check if user is assigned to this shift
			const isAssigned = shift.assigned_employees.some(
				(empId) => String(empId) === String(user.id),
			);
			return isAssigned;
		});
	};

	if (!selectedLocation) {
		return (
			<Card>
				<CardContent className='pt-6 text-center'>
					<p>Wybierz lokalizację, aby zobaczyć grafik.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='flex flex-col gap-4'>
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-xl font-bold'>
						Mój grafik
					</CardTitle>
					<div className='flex items-center space-x-2'>
						<Button
							variant='outline'
							size='icon'
							onClick={previousWeek}
							disabled={loading}>
							<ChevronLeft className='h-4 w-4' />
						</Button>
						<span className='min-w-[200px] text-center font-medium'>
							{format(currentWeekStart, 'd MMMM', { locale: pl })}{' '}
							- {format(currentWeekEnd, 'd MMMM', { locale: pl })}
						</span>
						<Button
							variant='outline'
							size='icon'
							onClick={nextWeek}
							disabled={loading}>
							<ChevronRight className='h-4 w-4' />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='flex justify-center items-center h-64'>
							<Spinner className='h-8 w-8' />
						</div>
					) : (
						<div className='overflow-x-auto'>
							<div className='min-w-[800px] border rounded-lg overflow-hidden bg-background'>
								{/* Header row */}
								<div className='grid grid-cols-8 border-b divide-x'>
									<div className='p-2 text-xs font-semibold text-center bg-muted/40 flex items-center justify-center'>
										Godzina
									</div>
									{weekDays.map((day, idx) => (
										<div
											key={idx}
											className={`p-2 text-center bg-muted/40 ${
												format(day, 'yyyy-MM-dd') ===
												format(new Date(), 'yyyy-MM-dd')
													? 'bg-primary/10'
													: ''
											}`}>
											<div className='font-semibold text-sm'>
												{format(day, 'EEE', {
													locale: pl,
												})}
											</div>
											<div className='text-xs text-muted-foreground'>
												{format(day, 'd MMM', {
													locale: pl,
												})}
											</div>
										</div>
									))}
								</div>

								<div className='relative'>
									{/* Time grid */}
									{hours.map((hour) => (
										<div
											key={hour}
											className='grid grid-cols-8 border-b last:border-b-0 divide-x h-[60px]'>
											<div className='p-2 text-xs text-muted-foreground text-right'>
												{hour
													.toString()
													.padStart(2, '0')}
												:00
											</div>
											{weekDays.map((_, dayIdx) => (
												<div
													key={dayIdx}
													className='relative'
												/>
											))}
										</div>
									))}

									{/* Shifts overlay */}
									<div className='absolute inset-0 grid grid-cols-8 divide-x pointer-events-none'>
										<div /> {/* Time column spacer */}
										{weekDays.map((day, dayIdx) => {
											const shifts =
												getMyShiftsForDay(day);

											return (
												<div
													key={dayIdx}
													className='relative h-full'>
													{shifts.map((shift) => {
														// Find the segment for the logged in user
														const userDetails =
															shift.assigned_employees_detail?.find(
																(d) =>
																	String(
																		d.employee_id,
																	) ===
																	String(
																		user?.id,
																	),
															);

														// If user has specific segments, display them
														// otherwise fall back to shift start/end

														let displaySegments: Array<{
															start: string;
															end: string;
														}> = [];

														if (
															userDetails?.segments &&
															userDetails.segments
																.length > 0
														) {
															displaySegments =
																userDetails.segments;
														} else {
															displaySegments = [
																{
																	start: shift.start,
																	end: shift.end,
																},
															];
														}

														return displaySegments.map(
															(
																segment,
																segIdx,
															) => {
																const startPixels =
																	timeToPixels(
																		segment.start,
																	);
																const endPixels =
																	timeToPixels(
																		segment.end,
																	);
																const height =
																	endPixels -
																	startPixels;

																return (
																	<div
																		key={`${shift.id}-${segIdx}`}
																		className='absolute left-1 right-1 rounded-md bg-primary text-primary-foreground p-1 text-xs shadow-sm flex flex-col items-center justify-center overflow-hidden pointer-events-auto hover:brightness-110 transition-all'
																		style={{
																			top: `${startPixels}px`,
																			height: `${height}px`,
																		}}
																		title={`${segment.start} - ${segment.end}`}>
																		<span className='font-semibold'>
																			{
																				segment.start
																			}{' '}
																			-{' '}
																			{
																				segment.end
																			}
																		</span>
																	</div>
																);
															},
														);
													})}
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
