/** @format */
'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
	format,
	startOfWeek,
	endOfWeek,
	addWeeks,
	subWeeks,
	addDays,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { Button } from '../ui/button';
import {
	FieldGroup,
	FieldSet,
	FieldLegend,
	FieldDescription,
	Field,
	FieldLabel,
	FieldSeparator,
	FieldTitle,
} from '../ui/field';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { submitDemand } from '@/lib/actions';
import type { components } from '@/lib/types/openapi';
import { useAlert } from '@/providers/alert-provider';

type Shift = {
	id: string;
	timeFrom: string;
	timeTo: string;
	experienced: boolean;
	amount: number;
};

type DayShifts = {
	day: string;
	shifts: Shift[];
};

const DAYS_OF_WEEK = [
	'Poniedziałek',
	'Wtorek',
	'Środa',
	'Czwartek',
	'Piątek',
	'Sobota',
	'Niedziela',
];

const createEmptyShift = (): Shift => ({
	id: Math.random().toString(36).substr(2, 9),
	timeFrom: '10:00',
	timeTo: '18:00',
	experienced: false,
	amount: 1,
});

export default function DemandForm() {
	const { showAlert } = useAlert();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
		startOfWeek(new Date(), { locale: pl, weekStartsOn: 1 })
	);

	const currentWeekEnd = endOfWeek(currentWeekStart, {
		locale: pl,
		weekStartsOn: 1,
	});

	// Generuj daty dla każdego dnia tygodnia
	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const date = addDays(currentWeekStart, i);
		return {
			name: DAYS_OF_WEEK[i],
			date: date,
			dateStr: format(date, 'd MMM', { locale: pl }),
		};
	});

	const [dayShifts, setDayShifts] = useState<DayShifts[]>(
		DAYS_OF_WEEK.map((day) => ({
			day,
			shifts: [createEmptyShift()],
		}))
	);

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

	const addShift = (dayIndex: number) => {
		setDayShifts((prev) => {
			const newDayShifts = [...prev];
			newDayShifts[dayIndex] = {
				...newDayShifts[dayIndex],
				shifts: [...newDayShifts[dayIndex].shifts, createEmptyShift()],
			};
			return newDayShifts;
		});
	};

	const removeShift = (dayIndex: number, shiftId: string) => {
		setDayShifts((prev) => {
			const newDayShifts = [...prev];
			newDayShifts[dayIndex].shifts = newDayShifts[
				dayIndex
			].shifts.filter((shift) => shift.id !== shiftId);
			return newDayShifts;
		});
	};

	const updateShift = (
		dayIndex: number,
		shiftId: string,
		field: keyof Shift,
		value: string | boolean | number
	) => {
		setDayShifts((prev) => {
			const newDayShifts = [...prev];
			const shiftIndex = newDayShifts[dayIndex].shifts.findIndex(
				(s) => s.id === shiftId
			);
			if (shiftIndex !== -1) {
				newDayShifts[dayIndex].shifts[shiftIndex] = {
					...newDayShifts[dayIndex].shifts[shiftIndex],
					[field]: value,
				};
			}
			return newDayShifts;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Przekształć dane formularza do formatu API
			const demandShifts: components['schemas']['DemandShiftIn'][] = [];

			dayShifts.forEach((dayData, dayIndex) => {
				const date = weekDays[dayIndex].date;
				const dateStr = format(date, 'yyyy-MM-dd');

				dayData.shifts.forEach((shift) => {
					demandShifts.push({
						date: dateStr,
						location: '', // pusty string jak w wymaganiach
						start: shift.timeFrom,
						end: shift.timeTo,
						demand: shift.amount,
						needs_experienced: shift.experienced,
					});
				});
			});

			const result = await submitDemand(demandShifts);

			showAlert({
				title: 'Sukces!',
				description: `Zapotrzebowanie zostało zapisane. ID: ${result.demand_id}`,
				variant: 'success',
			});

			console.log('✅ Demand created:', result);
		} catch (error) {
			console.error('❌ Error submitting demand:', error);
			showAlert({
				title: 'Błąd',
				description:
					error instanceof Error
						? error.message
						: 'Nie udało się zapisać zapotrzebowania',
				variant: 'error',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<FieldGroup>
				<FieldSet>
					<FieldLegend>Zapotrzebowanie Twojej firmy</FieldLegend>
					<FieldDescription>
						Podaj ile pracowników potrzebujesz w jakich godzinach
						dla każdego dnia tygodnia
					</FieldDescription>

					{/* Nawigacja tygodniowa */}
					<div className='flex flex-col bg-muted/50 rounded-lg'>
						<div className='flex items-center justify-between p-4 '>
							<Button
								type='button'
								variant='outline'
								size='icon'
								onClick={handlePreviousWeek}>
								<ChevronLeft className='h-4 w-4' />
							</Button>
							<div className='flex flex-col items-center gap-1'>
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
								type='button'
								variant='outline'
								size='icon'
								onClick={handleNextWeek}>
								<ChevronRight className='h-4 w-4' />
							</Button>
						</div>
						<div className='flex justify-center mb-4'>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={handleCurrentWeek}
								className=''>
								Obecny tydzień
							</Button>
						</div>
					</div>

					<div className='space-y-4'>
						{dayShifts.map((dayData, dayIndex) => {
							const dayInfo = weekDays[dayIndex];
							return (
								<Card key={dayData.day}>
									<CardHeader>
										<CardTitle className='text-lg flex items-center gap-2'>
											<span>{dayInfo.name}</span>
											<span className='text-sm font-normal text-muted-foreground'>
												{dayInfo.dateStr}
											</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='space-y-4'>
											{dayData.shifts.map(
												(shift, shiftIndex) => (
													<div
														key={shift.id}
														className='flex gap-4 items-start p-4 border rounded-lg bg-muted/30'>
														<div className='flex gap-4 flex-1 flex-wrap'>
															<Field
																orientation='horizontal'
																className='max-w-fit'>
																<FieldLabel
																	htmlFor={`${dayData.day}-${shift.id}-from`}>
																	Od
																</FieldLabel>
																<Input
																	type='time'
																	id={`${dayData.day}-${shift.id}-from`}
																	value={
																		shift.timeFrom
																	}
																	onChange={(
																		e
																	) =>
																		updateShift(
																			dayIndex,
																			shift.id,
																			'timeFrom',
																			e
																				.target
																				.value
																		)
																	}
																	className='max-w-[120px] bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
																/>
															</Field>

															<Field
																orientation='horizontal'
																className='max-w-fit'>
																<FieldLabel
																	htmlFor={`${dayData.day}-${shift.id}-to`}>
																	Do
																</FieldLabel>
																<Input
																	type='time'
																	id={`${dayData.day}-${shift.id}-to`}
																	value={
																		shift.timeTo
																	}
																	onChange={(
																		e
																	) =>
																		updateShift(
																			dayIndex,
																			shift.id,
																			'timeTo',
																			e
																				.target
																				.value
																		)
																	}
																	className='max-w-[120px] bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
																/>
															</Field>

															<Field
																orientation='horizontal'
																className='max-w-fit gap-2'>
																<FieldLabel
																	htmlFor={`${dayData.day}-${shift.id}-experienced`}>
																	Doświadczony
																</FieldLabel>
																<Switch
																	id={`${dayData.day}-${shift.id}-experienced`}
																	checked={
																		shift.experienced
																	}
																	onCheckedChange={(
																		checked
																	) =>
																		updateShift(
																			dayIndex,
																			shift.id,
																			'experienced',
																			checked
																		)
																	}
																/>
															</Field>

															<Field
																orientation='horizontal'
																className='max-w-fit'>
																<FieldLabel
																	htmlFor={`${dayData.day}-${shift.id}-amount`}>
																	Ile Osób
																</FieldLabel>
																<Input
																	type='number'
																	id={`${dayData.day}-${shift.id}-amount`}
																	value={
																		shift.amount
																	}
																	onChange={(
																		e
																	) =>
																		updateShift(
																			dayIndex,
																			shift.id,
																			'amount',
																			parseInt(
																				e
																					.target
																					.value
																			) ||
																				1
																		)
																	}
																	min='1'
																	className='max-w-[80px] bg-background'
																/>
															</Field>
														</div>

														{dayData.shifts.length >
															1 && (
															<Button
																type='button'
																variant='ghost'
																size='icon'
																className='text-destructive hover:text-destructive'
																onClick={() =>
																	removeShift(
																		dayIndex,
																		shift.id
																	)
																}>
																<Trash2 className='h-4 w-4' />
															</Button>
														)}
													</div>
												)
											)}

											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={() =>
													addShift(dayIndex)
												}
												className='w-1/4 place-self-center'>
												<Plus className='h-4 w-4 mr-2' />
												Dodaj zmianę
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</FieldSet>

				<FieldSeparator />

				<Field orientation='horizontal'>
					<Button type='submit' disabled={isSubmitting}>
						{isSubmitting
							? 'Zapisywanie...'
							: 'Zapisz zapotrzebowanie'}
					</Button>
					<Button
						variant='outline'
						type='button'
						disabled={isSubmitting}>
						Anuluj
					</Button>
				</Field>
			</FieldGroup>
		</form>
	);
}
