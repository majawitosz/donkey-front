/** @format */
'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
	format,
	startOfWeek,
	endOfWeek,
	addWeeks,
	subWeeks,
	addDays,
	isSameWeek,
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
import { Spinner } from '../ui/spinner';
import { submitDemand, fetchDefaultDemand } from '@/lib/actions';
import type { components } from '@/lib/types/openapi';
import { useAlert } from '@/providers/alert-provider';
import { useUser } from '@/providers/user-provider';

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

let shiftIdCounter = 0;

const createEmptyShift = (): Shift => ({
	id: `shift-${++shiftIdCounter}`,
	timeFrom: '10:00',
	timeTo: '18:00',
	experienced: false,
	amount: 1,
});

export default function DemandForm() {
	const { selectedLocation } = useUser();
	const { showAlert } = useAlert();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
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

	// Sprawdź czy aktualnie wyświetlany tydzień to obecny tydzień
	const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), {
		locale: pl,
		weekStartsOn: 1,
	});

	// Załaduj domyślne zapotrzebowanie przy montowaniu komponentu
	useEffect(() => {
		const loadDefaultDemand = async () => {
			if (!selectedLocation) return;
			try {
				setIsLoading(true);
				const defaultDemand = await fetchDefaultDemand(
					selectedLocation.id.toString()
				);

				// Przekształć dane z API do formatu formularza
				if (
					defaultDemand.defaults &&
					defaultDemand.defaults.length > 0
				) {
					const loadedShifts: DayShifts[] = DAYS_OF_WEEK.map(
						(dayName, dayIndex) => {
							// Znajdź dane dla tego dnia tygodnia
							const dayData = defaultDemand.defaults.find(
								(d) => d.weekday === dayIndex
							);

							if (dayData && dayData.items.length > 0) {
								return {
									day: dayName,
									shifts: dayData.items.map((item) => ({
										id: `shift-${++shiftIdCounter}`,
										timeFrom: item.start,
										timeTo: item.end,
										experienced: item.needs_experienced,
										amount: item.demand,
									})),
								};
							}

							// Jeśli brak danych dla tego dnia, użyj pustej zmiany
							return {
								day: dayName,
								shifts: [createEmptyShift()],
							};
						}
					);

					setDayShifts(loadedShifts);
				}
			} catch (error) {
				console.log('ℹ️ No default demand found, using empty form');
				// Nie pokazujemy alertu - to normalna sytuacja dla nowego użytkownika
			} finally {
				setIsLoading(false);
			}
		};

		loadDefaultDemand();
	}, [selectedLocation]);

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

		if (!selectedLocation) {
			showAlert({
				title: 'Błąd',
				description: 'Wybierz lokalizację',
				variant: 'error',
			});
			return;
		}

		setIsSubmitting(true);

		try {
			// Przekształć dane formularza do nowego formatu API
			const shiftsPerDay = dayShifts.map((dayData, dayIndex) => ({
				weekday: dayIndex, // 0 = Poniedziałek, 6 = Niedziela
				shifts: dayData.shifts.map((shift) => ({
					timeFrom: shift.timeFrom,
					timeTo: shift.timeTo,
					experienced: shift.experienced,
					amount: shift.amount,
				})),
			}));

			const result = await submitDemand(
				shiftsPerDay,
				selectedLocation.id.toString()
			);

			showAlert({
				title: 'Sukces!',
				description: `Domyślne zapotrzebowanie zostało zapisane.`,
				variant: 'success',
			});

			console.log('✅ Default demand saved:', result);
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

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-12'>
				<Spinner className='mr-2 h-8 w-8' />
				<p className='text-muted-foreground'>
					Ładowanie zapotrzebowania...
				</p>
			</div>
		);
	}

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
								onClick={handlePreviousWeek}
								disabled={isCurrentWeek}>
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
						<div className='flex justify-center mb-4 gap-2'>
							<Button
								type='button'
								variant={isCurrentWeek ? 'outline' : 'default'}
								size='sm'
								onClick={handleCurrentWeek}
								disabled={isCurrentWeek}>
								Obecny tydzień
							</Button>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => {}}>
								Ustaw jako domyślne
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
						{isSubmitting && <Spinner className='mr-2' />}
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
