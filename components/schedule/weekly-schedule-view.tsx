/** @format */
'use client';

import * as React from 'react';
import { format, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchEmployeeDetails, updateShift } from '@/lib/actions';
import type { components } from '@/lib/types/openapi';

type GenerateResultOut = components['schemas']['GenerateResultOut'];
type ScheduleShiftOut = components['schemas']['ScheduleShiftOut'];
type ShiftAssignedEmployeeOut =
	components['schemas']['ShiftAssignedEmployeeOut'];
type ShiftEmployeeSegmentOut = components['schemas']['ShiftEmployeeSegmentOut'];

interface WeeklyScheduleViewProps {
	weekStart: Date;
	scheduleData: GenerateResultOut;
	onScheduleUpdate?: () => void;
}

const START_HOUR = 8;
const END_HOUR = 22;

const generateHours = () => {
	const hours: number[] = [];
	for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
		hours.push(hour);
	}
	return hours;
};

const hours = generateHours();
const HOUR_HEIGHT = 40; // Wysokość jednej godziny w pikselach

// Konwertuje czas (HH:MM) na offset w pikselach od początku dnia
const timeToPixels = (time: string): number => {
	const [h, m] = time.split(':').map(Number);
	const totalMinutes = (h - START_HOUR) * 60 + m;
	return (totalMinutes / 60) * HOUR_HEIGHT;
};

// Pobiera zmiany dla konkretnego dnia
const getShiftsForDay = (
	date: Date,
	scheduleData: GenerateResultOut
): ScheduleShiftOut[] => {
	const dateStr = format(date, 'yyyy-MM-dd');
	return scheduleData.assignments.filter((shift) => shift.date === dateStr);
};

// Pomocnicza funkcja do sortowania segmentów czasu
const sortTimeSegments = (a: { start: string }, b: { start: string }) =>
	a.start.localeCompare(b.start);

// Komponent zbiorczego bloku dnia
function DaySummaryBlock({
	shifts,
	onScheduleUpdate,
	employeeNames,
}: {
	shifts: ScheduleShiftOut[];
	onScheduleUpdate?: () => void;
	employeeNames: Record<string, string>;
}) {
	const [dialogOpen, setDialogOpen] = React.useState(false);

	// Stan edycji konkretnego pracownika
	const [editingEmployee, setEditingEmployee] = React.useState<{
		shiftId: string;
		employee: ShiftAssignedEmployeeOut;
		segment: ShiftEmployeeSegmentOut;
		employeeName: string;
	} | null>(null);

	const [newStartTime, setNewStartTime] = React.useState('');
	const [newEndTime, setNewEndTime] = React.useState('');

	// 1. Obliczamy ramy czasowe całego bloku (min start, max end)
	// Używamy wszystkich czasów start i end ze shiftów
	const times = shifts.flatMap((s) =>
		[s.start, s.end].map((t) => {
			const [h, m] = t.split(':').map(Number);
			return h * 60 + m;
		})
	);

	const minMinutes = Math.min(...times);
	const maxMinutes = Math.max(...times);

	const minTimeStr = `${Math.floor(minMinutes / 60)
		.toString()
		.padStart(2, '0')}:${(minMinutes % 60).toString().padStart(2, '0')}`;
	const maxTimeStr = `${Math.floor(maxMinutes / 60)
		.toString()
		.padStart(2, '0')}:${(maxMinutes % 60).toString().padStart(2, '0')}`;

	const top = timeToPixels(minTimeStr);
	const height = timeToPixels(maxTimeStr) - top;

	// 2. Obliczamy statystyki
	let totalDemand = 0;
	let totalAssigned = 0;
	let hasUnstaffed = false;

	shifts.forEach((s) => {
		totalDemand += s.demand;
		// Liczymy unikalnych pracowników w obrębie jednej zmiany (powinno być 1:1, ale dla pewności length)
		const assignedCount = s.assigned_employees.length;
		totalAssigned += assignedCount;
		if (assignedCount < s.demand) hasUnstaffed = true;
	});

	// Kolorowanie bloku
	let bgColor = 'bg-blue-500/90 dark:bg-blue-600/80';
	let borderColor = 'border-blue-600';

	if (totalAssigned === 0 && totalDemand > 0) {
		bgColor = 'bg-orange-700/95 dark:bg-orange-800/90';
		borderColor = 'border-orange-800';
	} else if (hasUnstaffed) {
		bgColor = 'bg-orange-400/95 dark:bg-orange-500/90';
		borderColor = 'border-orange-600';
	}

	// Agregacja danych do dialogu
	// a) Braki kadrowe
	const allMissingSegments = shifts
		.flatMap((s) =>
			(s.missing_segments || []).map((ms) => ({
				...ms,
				// Obliczamy ile brakuje, używając missing z API, lub fallback do demand-assigned
				calculatedMissing:
					ms.missing ??
					Math.max(1, s.demand - s.assigned_employees.length),
			}))
		)
		.sort(sortTimeSegments);

	// b) Przypisani pracownicy (spłaszczamy strukturę)
	const allAssignedDetails = shifts
		.flatMap((s) =>
			(s.assigned_employees_detail || []).map((emp) => ({
				shiftId: s.id,
				employee: emp,
				segments: emp.segments,
				employeeName:
					employeeNames[emp.employee_id] ||
					emp.employee_name ||
					'Pracownik',
			}))
		)
		.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

	// Renderowanie bloku na siatce
	return (
		<>
			<div
				className='absolute w-full px-1 py-0.5 z-10'
				style={{
					top: `${top}px`,
					height: `${height}px`,
				}}>
				<div
					onClick={() => {
						setDialogOpen(true);
						setEditingEmployee(null);
					}}
					className={`w-full h-full ${bgColor} border ${borderColor} rounded text-white overflow-hidden cursor-pointer hover:brightness-110 transition-all flex flex-col items-center justify-center p-0.5 shadow-md`}
					title={`Start: ${minTimeStr}\nKoniec: ${maxTimeStr}\nŁącznie osób: ${totalAssigned}/${totalDemand}`}>
					<div className='text-[11px] font-bold text-center leading-tight'>
						{totalAssigned}/{totalDemand} osoby
					</div>
					<div className='text-[10px] text-center opacity-90 mt-0.5'>
						{minTimeStr} - {maxTimeStr}
					</div>
				</div>
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className='max-w-md max-h-[80vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>
							{editingEmployee
								? 'Edycja zmiany pracownika'
								: 'Szczegóły dnia'}
						</DialogTitle>
					</DialogHeader>

					{!editingEmployee ? (
						<div className='space-y-6 pt-2'>
							{/* Sekcja: Braki kadrowe */}
							{allMissingSegments.length > 0 && (
								<div className='space-y-2'>
									<h4 className='text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2'>
										<div className='w-2 h-2 rounded-full bg-orange-500' />
										Braki kadrowe
									</h4>
									<div className='bg-orange-50 dark:bg-orange-950/10 rounded-md border border-orange-100 dark:border-orange-900/20 divide-y divide-orange-100 dark:divide-orange-900/20'>
										{allMissingSegments.map((seg, idx) => (
											<div
												key={idx}
												className='flex justify-between items-center p-3 text-sm'>
												<span className='font-mono font-medium text-foreground/80'>
													{seg.start} - {seg.end}
												</span>
												<span className='text-orange-600 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded text-xs'>
													Brak {seg.calculatedMissing}{' '}
													os.
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Sekcja: Przypisani pracownicy */}
							<div className='space-y-2'>
								<h4 className='text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2'>
									<div className='w-2 h-2 rounded-full bg-blue-500' />
									Obsada ({allAssignedDetails.length} os.)
								</h4>

								{allAssignedDetails.length > 0 ? (
									<div className='space-y-2'>
										{allAssignedDetails.map((item, idx) => (
											<div
												key={idx}
												className='bg-card border rounded-md p-3 shadow-sm hover:border-primary/50 transition-colors'>
												<div className='flex justify-between items-center mb-2'>
													<span className='font-semibold text-sm'>
														{item.employeeName}
													</span>
												</div>
												<div className='space-y-1.5 pl-0'>
													{item.segments.map(
														(seg, segIdx) => (
															<div
																key={segIdx}
																className='flex justify-between items-center text-xs bg-muted/50 rounded px-2 py-1.5'>
																<span className='font-mono text-muted-foreground'>
																	{seg.start}{' '}
																	- {seg.end}
																</span>
																<Button
																	variant='ghost'
																	size='sm'
																	className='h-6 text-xs hover:bg-background hover:text-primary px-2'
																	onClick={() => {
																		setEditingEmployee(
																			{
																				shiftId:
																					item.shiftId,
																				employee:
																					item.employee,
																				segment:
																					seg,
																				employeeName:
																					item.employeeName,
																			}
																		);
																		setNewStartTime(
																			seg.start
																		);
																		setNewEndTime(
																			seg.end
																		);
																	}}>
																	Edytuj
																</Button>
															</div>
														)
													)}
												</div>
											</div>
										))}
									</div>
								) : (
									<div className='text-sm text-muted-foreground italic p-4 text-center border rounded-md border-dashed'>
										Brak przypisanych pracowników w tym
										dniu.
									</div>
								)}
							</div>

							<div className='flex justify-end pt-2'>
								<Button
									variant='outline'
									onClick={() => setDialogOpen(false)}>
									Zamknij
								</Button>
							</div>
						</div>
					) : (
						// Formularz edycji (uproszczony)
						<div className='space-y-4 py-2'>
							<div className='text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-md'>
								Edycja godzin dla:{' '}
								<span className='font-semibold text-foreground block mt-1 text-base'>
									{editingEmployee.employeeName}
								</span>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='start-time'>Początek</Label>
									<Input
										id='start-time'
										type='time'
										value={newStartTime}
										onChange={(e) =>
											setNewStartTime(e.target.value)
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='end-time'>Koniec</Label>
									<Input
										id='end-time'
										type='time'
										value={newEndTime}
										onChange={(e) =>
											setNewEndTime(e.target.value)
										}
									/>
								</div>
							</div>

							<div className='flex justify-end space-x-2 pt-6 border-t mt-4'>
								<Button
									variant='outline'
									onClick={() => setEditingEmployee(null)}>
									Wróć
								</Button>
								<Button
									onClick={async () => {
										try {
											// Znajdź oryginalny shift, w którym jest ten pracownik
											const targetShift = shifts.find(
												(s) =>
													s.id ===
													editingEmployee.shiftId
											);
											if (!targetShift) return;

											// Aktualizujemy dane pracownika w tym shifcie
											const updatedEmployees = (
												targetShift.assigned_employees_detail ||
												[]
											).map((emp) => {
												if (
													emp.employee_id ===
													editingEmployee.employee
														.employee_id
												) {
													// Tworzymy nową listę segmentów
													const newSegments = [
														...emp.segments,
													];
													// Znajdź segment do zastąpienia
													const segIdx =
														newSegments.findIndex(
															(s) =>
																s.start ===
																	editingEmployee
																		.segment
																		.start &&
																s.end ===
																	editingEmployee
																		.segment
																		.end
														);

													if (segIdx !== -1) {
														newSegments[segIdx] = {
															start: newStartTime,
															end: newEndTime,
															minutes: 0, // API przeliczy
														};
													}
													return {
														...emp,
														segments: newSegments,
													};
												}
												return emp;
											});

											await updateShift({
												...targetShift,
												assigned_employees_detail:
													updatedEmployees,
											});

											setEditingEmployee(null); // Wróć do widoku dnia
											if (onScheduleUpdate)
												onScheduleUpdate();
										} catch (err) {
											console.error(err);
											// Opcjonalnie: alert o błędzie
										}
									}}>
									Zapisz
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

// Komponent kolumny dnia
function DayColumn({
	shifts,
	onScheduleUpdate,
	employeeNames,
}: {
	date: Date;
	shifts: ScheduleShiftOut[];
	onScheduleUpdate?: () => void;
	employeeNames: Record<string, string>;
}) {
	// Jeśli nie ma zmian w tym dniu, renderujemy pustą kolumnę
	if (!shifts || shifts.length === 0) {
		return (
			<div className='relative border-r last:border-r-0 h-full'>
				{/* Empty column */}
			</div>
		);
	}

	// Renderujemy jeden zagregowany blok na cały dzień
	return (
		<div
			className='relative border-r last:border-r-0'
			style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
			<DaySummaryBlock
				shifts={shifts}
				onScheduleUpdate={onScheduleUpdate}
				employeeNames={employeeNames}
			/>
		</div>
	);
}

export default function WeeklyScheduleView({
	weekStart,
	scheduleData,
	onScheduleUpdate,
}: WeeklyScheduleViewProps) {
	const [employeeNames, setEmployeeNames] = React.useState<
		Record<string, string>
	>({});

	// Pobierz imiona i nazwiska wszystkich pracowników
	React.useEffect(() => {
		const fetchAllEmployeeNames = async () => {
			const uniqueEmployeeIds = new Set<string>();
			scheduleData.assignments.forEach((shift) => {
				shift.assigned_employees_detail?.forEach((employee) => {
					uniqueEmployeeIds.add(employee.employee_id);
				});
				// Również z listy ID jeśli detali brakuje
				shift.assigned_employees.forEach((id) =>
					uniqueEmployeeIds.add(id)
				);
			});

			const names: Record<string, string> = {};
			// Optymalizacja: pobieraj równolegle
			const promises = Array.from(uniqueEmployeeIds).map(
				async (employeeId) => {
					try {
						const details = await fetchEmployeeDetails(employeeId);
						return {
							id: employeeId,
							name: `${details.first_name} ${details.last_name}`,
						};
					} catch (error) {
						console.error(
							`Failed to fetch employee ${employeeId}:`,
							error
						);
						return { id: employeeId, name: 'Nieznany pracownik' };
					}
				}
			);

			const results = await Promise.all(promises);
			results.forEach((res) => {
				names[res.id] = res.name;
			});

			setEmployeeNames(names);
		};

		if (scheduleData?.assignments) {
			fetchAllEmployeeNames();
		}
	}, [scheduleData]);

	// Oblicz podsumowanie godzin dla pracowników
	const employeeHoursSummary = React.useMemo(() => {
		const hoursMap = new Map<
			string,
			{ name: string; hours: number; employeeId: string }
		>();

		scheduleData.assignments.forEach((shift) => {
			shift.assigned_employees_detail?.forEach((employee) => {
				const employeeName =
					employeeNames[employee.employee_id] ||
					employee.employee_name ||
					'Ładowanie...';
				const employeeId = employee.employee_id;

				// Oblicz godziny dla tego pracownika w tej zmianie
				let totalMinutes = 0;
				// Jeśli są segmenty to sumujemy segmenty, jeśli nie to bierzemy główne start/end pracownika
				if (employee.segments && employee.segments.length > 0) {
					employee.segments.forEach((segment) => {
						const [startH, startM] = segment.start
							.split(':')
							.map(Number);
						const [endH, endM] = segment.end.split(':').map(Number);
						totalMinutes +=
							endH * 60 + endM - (startH * 60 + startM);
					});
				} else if (employee.start && employee.end) {
					const [startH, startM] = employee.start
						.split(':')
						.map(Number);
					const [endH, endM] = employee.end.split(':').map(Number);
					totalMinutes += endH * 60 + endM - (startH * 60 + startM);
				}

				const hours = totalMinutes / 60;

				if (hoursMap.has(employeeId)) {
					const current = hoursMap.get(employeeId)!;
					current.hours += hours;
					if (
						current.name === 'Ładowanie...' &&
						employeeName !== 'Ładowanie...'
					) {
						current.name = employeeName;
					}
				} else {
					hoursMap.set(employeeId, {
						name: employeeName,
						hours: hours,
						employeeId,
					});
				}
			});
		});

		return Array.from(hoursMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name, 'pl')
		);
	}, [scheduleData, employeeNames]);

	const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	return (
		<div className='w-full'>
			<div className='mb-4'>
				<h3 className='text-lg font-semibold'>Wygenerowany grafik</h3>
				<p className='text-sm text-muted-foreground'>
					Demand ID: {scheduleData.demand_id} | Łącznie zmian:{' '}
					{scheduleData.assignments.length}
				</p>
			</div>

			<div className='overflow-x-auto'>
				<div className='min-w-[900px]'>
					{/* Kalendarz w stylu Google Calendar */}
					<div className='grid grid-cols-8 border rounded-lg overflow-hidden relative'>
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
								<div className='bg-muted/30 border-r border-b p-2 text-xs font-medium text-right text-muted-foreground h-[40px] box-border'>
									{hour.toString().padStart(2, '0')}:00
								</div>

								{/* Kolumny dla każdego dnia */}
								{weekDays.map((day, dayIdx) => (
									<div
										key={`${dayIdx}-${hour}`}
										className='border-r last:border-r-0 border-b relative'
										style={{
											height: `${HOUR_HEIGHT}px`,
										}}>
										{/* Linie pomocnicze półgodzinne opcjonalnie */}
									</div>
								))}
							</React.Fragment>
						))}

						{/* Warstwa danych - pozycjonowana absolutnie na siatce */}
						<div className='absolute top-[37px] left-0 right-0 bottom-0 grid grid-cols-8 pointer-events-none'>
							{/* Pusta kolumna nad godzinami */}
							<div />

							{/* Kolumny z danymi */}
							{weekDays.map((day, dayIdx) => {
								const dayShifts = getShiftsForDay(
									day,
									scheduleData
								);
								return (
									<div
										key={dayIdx}
										className='pointer-events-auto'>
										<DayColumn
											date={day}
											shifts={dayShifts}
											onScheduleUpdate={onScheduleUpdate}
											employeeNames={employeeNames}
										/>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Legenda */}
			<div className='mt-4 flex items-center gap-4 text-sm flex-wrap'>
				<div className='flex items-center gap-2'>
					<div className='w-4 h-4 bg-blue-500/80 dark:bg-blue-600/70 rounded border border-blue-600' />
					<span className='text-muted-foreground'>Pełna obsada</span>
				</div>
				<div className='flex items-center gap-2'>
					<div className='w-4 h-4 bg-orange-400/90 dark:bg-orange-500/80 rounded border border-orange-500' />
					<span className='text-muted-foreground'>Braki kadrowe</span>
				</div>
				<div className='flex items-center gap-2'>
					<div className='w-4 h-4 bg-orange-700/90 dark:bg-orange-800/80 rounded border border-orange-800' />
					<span className='text-muted-foreground'>
						Dzień nieobsadzony
					</span>
				</div>
			</div>

			{/* Podsumowanie */}

			<div className='mt-4 p-4  rounded-lg'>
				<h4 className='font-semibold mb-2'>Podsumowanie</h4>

				{/* Podsumowanie godzin pracowników */}
				<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
					{employeeHoursSummary.map((employee) => (
						<div
							key={employee.employeeId}
							className='flex items-center justify-between p-2  rounded border'>
							<span className='text-sm font-medium'>
								{employee.name}
							</span>
							<span className='text-sm text-muted-foreground'>
								{employee.hours.toFixed(1)}h
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
