/** @format */
'use client';

import * as React from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { components } from '@/lib/types/openapi';

type AvailabilityOut = components['schemas']['AvailabilityOut'];
type SlotOut = components['schemas']['SlotOut'];

interface WeeklyAvailabilityViewProps {
	employeeName: string;
	employeeId: string;
	weekStart: Date;
	availabilityData: AvailabilityOut[];
	onClose: () => void;
}

// Generujemy godziny od 6:00 do 22:00
const generateHours = () => {
	const hours: number[] = [];
	for (let hour = 6; hour <= 22; hour++) {
		hours.push(hour);
	}
	return hours;
};

const hours = generateHours();
const HOUR_HEIGHT = 60; // Wysokość jednej godziny w pikselach

// Konwertuje czas (HH:MM) na offset w pikselach od początku dnia
const timeToPixels = (time: string): number => {
	const [h, m] = time.split(':').map(Number);
	const totalMinutes = (h - 6) * 60 + m; // Odejmujemy 6 bo zaczynamy od 6:00
	return (totalMinutes / 60) * HOUR_HEIGHT;
};

// Pobiera sloty dla konkretnego dnia
const getSlotsForDay = (
	date: Date,
	availabilityData: AvailabilityOut[]
): SlotOut[] => {
	const dateStr = format(date, 'yyyy-MM-dd');
	const dayAvailability = availabilityData.find((a) => a.date === dateStr);
	return dayAvailability?.available_slots || [];
};

export default function WeeklyAvailabilityView({
	employeeName,
	employeeId,
	weekStart,
	availabilityData,
	onClose,
}: WeeklyAvailabilityViewProps) {
	const weekEnd = endOfWeek(weekStart, { locale: pl, weekStartsOn: 1 });
	const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	return (
		<Card className='mt-6'>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle>Dostępność: {employeeName}</CardTitle>
						<p className='text-sm text-muted-foreground mt-1'>
							{format(weekStart, 'd MMMM', { locale: pl })} -{' '}
							{format(weekEnd, 'd MMMM yyyy', { locale: pl })}
						</p>
					</div>
					<Button variant='ghost' size='icon' onClick={onClose}>
						<X className='h-4 w-4' />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<div className='min-w-[900px]'>
						{/* Kalendarz w stylu Google Calendar */}
						<div className='grid grid-cols-8 border rounded-lg overflow-hidden'>
							{/* Pusta komórka dla nagłówka czasu */}
							<div className='bg-muted border-r border-b p-2 text-xs font-semibold text-center'>
								Godzina
							</div>

							{/* Nagłówki dni tygodnia */}
							{weekDays.map((day, idx) => (
								<div
									key={idx}
									className='bg-muted border-r last:border-r-0 border-b p-2 text-center'>
									<div className='font-semibold text-sm'>
										{format(day, 'EEE', { locale: pl })}
									</div>
									<div className='text-xs text-muted-foreground'>
										{format(day, 'd MMM', { locale: pl })}
									</div>
								</div>
							))}

							{/* Siatka godzin */}
							{hours.map((hour) => (
								<React.Fragment key={hour}>
									{/* Kolumna z godziną */}
									<div className='bg-muted/30 border-r border-b p-2 text-xs font-medium text-right text-muted-foreground'>
										{hour.toString().padStart(2, '0')}:00
									</div>

									{/* Kolumny dla każdego dnia */}
									{weekDays.map((day, dayIdx) => {
										const slots = getSlotsForDay(
											day,
											availabilityData
										);
										return (
											<div
												key={`${dayIdx}-${hour}`}
												className='border-r last:border-r-0 border-b relative'
												style={{
													height: `${HOUR_HEIGHT}px`,
												}}>
												{/* Renderujemy bloki dostępności jako absolutnie pozycjonowane elementy */}
												{slots.map((slot, slotIdx) => {
													const topOffset =
														timeToPixels(
															slot.start
														);
													const bottomOffset =
														timeToPixels(slot.end);
													const slotHeight =
														bottomOffset -
														topOffset;

													// Sprawdzamy czy slot zaczyna się w tej godzinie
													const [startHour] =
														slot.start
															.split(':')
															.map(Number);
													const [endHour] = slot.end
														.split(':')
														.map(Number);

													if (
														startHour <= hour &&
														endHour > hour
													) {
														// Obliczamy offset względem aktualnej godziny
														const relativeTop =
															startHour === hour
																? topOffset %
																  HOUR_HEIGHT
																: 0;
														const relativeHeight =
															startHour === hour
																? Math.min(
																		slotHeight,
																		HOUR_HEIGHT -
																			relativeTop
																  )
																: endHour ===
																  hour + 1
																? bottomOffset %
																		HOUR_HEIGHT ||
																  HOUR_HEIGHT
																: HOUR_HEIGHT;

														return (
															<div
																key={slotIdx}
																className='absolute inset-x-1 bg-green-500/80 dark:bg-green-600/70 rounded-sm border border-green-600 dark:border-green-500 flex items-center justify-center text-xs font-medium text-white'
																style={{
																	top: `${relativeTop}px`,
																	height: `${relativeHeight}px`,
																}}>
																{startHour ===
																	hour && (
																	<span>
																		{
																			slot.start
																		}{' '}
																		-{' '}
																		{
																			slot.end
																		}
																	</span>
																)}
															</div>
														);
													}
													return null;
												})}
											</div>
										);
									})}
								</React.Fragment>
							))}
						</div>
					</div>
				</div>

				{/* Legenda */}
				<div className='mt-4 flex items-center gap-4 text-sm'>
					<div className='flex items-center gap-2'>
						<div className='w-4 h-4 bg-green-500/80 dark:bg-green-600/70 rounded border border-green-600' />
						<span className='text-muted-foreground'>Dostępny</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
