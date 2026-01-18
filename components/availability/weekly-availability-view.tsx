/** @format */
'use client';

import * as React from 'react';
import { format, addDays, endOfWeek } from 'date-fns';
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

const generateHours = () => {
	const hours: number[] = [];
	for (let hour = 6; hour <= 22; hour++) {
		hours.push(hour);
	}
	return hours;
};

const hours = generateHours();
const HOUR_HEIGHT = 60; 

const timeToPixels = (time: string): number => {
	const [h, m] = time.split(':').map(Number);
	const totalMinutes = (h - 6) * 60 + m; 
	return (totalMinutes / 60) * HOUR_HEIGHT;
};

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
					<div className='flex gap-2'>
						{/* Kolumna z godzinami */}
						<div className='flex-shrink-0 w-16'>
							<div className='h-12 flex items-center justify-center text-xs font-semibold text-muted-foreground'>
								Godzina
							</div>
							<div
								className='relative'
								style={{
									height: `${hours.length * HOUR_HEIGHT}px`,
								}}>
								{hours.map((hour) => (
									<div
										key={hour}
										className='absolute inset-x-0 border-t text-right pr-2 text-xs text-muted-foreground'
										style={{
											top: `${
												(hour - 6) * HOUR_HEIGHT
											}px`,
											height: `${HOUR_HEIGHT}px`,
										}}>
										<div className='pt-1'>
											{hour.toString().padStart(2, '0')}
											:00
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Kolumny dla każdego dnia */}
						{weekDays.map((day, dayIdx) => {
							const slots = getSlotsForDay(day, availabilityData);
							return (
								<div
									key={dayIdx}
									className='flex-1 min-w-[120px]'>
									{/* Nagłówek dnia */}
									<div className='h-12 border rounded-t-lg bg-muted flex flex-col items-center justify-center'>
										<div className='font-semibold text-sm'>
											{format(day, 'EEE', { locale: pl })}
										</div>
										<div className='text-xs text-muted-foreground'>
											{format(day, 'd MMM', {
												locale: pl,
											})}
										</div>
									</div>

									{/* Obszar z dostępnością */}
									<div
										className='relative border border-t-0 rounded-b-lg bg-muted/20'
										style={{
											height: `${
												hours.length * HOUR_HEIGHT
											}px`,
										}}>
										{/* Linie godzinowe */}
										{hours.map((hour) => (
											<div
												key={hour}
												className='absolute inset-x-0 border-t border-border/50'
												style={{
													top: `${
														(hour - 6) * HOUR_HEIGHT
													}px`,
												}}
											/>
										))}

										{/* Bloki dostępności */}
										{slots.map((slot, slotIdx) => {
											const topOffset = timeToPixels(
												slot.start
											);
											const bottomOffset = timeToPixels(
												slot.end
											);
											const slotHeight =
												bottomOffset - topOffset;

											return (
												<div
													key={slotIdx}
													className='absolute inset-x-1 bg-green-500/90 dark:bg-green-600/80 rounded-sm flex items-center justify-center text-white font-medium'
													style={{
														top: `${topOffset}px`,
														height: `${slotHeight}px`,
													}}>
													{slotHeight > 30 && (
														<div className='text-center text-xs'>
															<div className='font-bold'>
																{slot.start.substring(
																	0,
																	5
																)}{' '}
																-{' '}
																{slot.end.substring(
																	0,
																	5
																)}
															</div>
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Legenda */}
				<div className='mt-4 flex items-center gap-4 text-sm'>
					<div className='flex items-center gap-2'>
						<div className='w-4 h-4 bg-green-500/90 dark:bg-green-600/80 rounded' />
						<span className='text-muted-foreground'>Dostępny</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
