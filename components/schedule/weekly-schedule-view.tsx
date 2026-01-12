/** @format */
'use client';

import * as React from 'react';
import { format, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
type ShiftUpdateIn = components['schemas']['ShiftUpdateIn'];
type ShiftAssignedEmployeeIn = components['schemas']['ShiftAssignedEmployeeIn'];
type ShiftEmployeeSegmentIn = components['schemas']['ShiftEmployeeSegmentIn'];
type UserDetail = components['schemas']['UserList'];

interface WeeklyScheduleViewProps {
	weekStart: Date;
	scheduleData: GenerateResultOut;
	onScheduleUpdate?: () => void;
}

const START_HOUR = 8;
const END_HOUR = 20;

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
	const totalMinutes = (h - START_HOUR) * 60 + m; // Odejmujemy START_HOUR bo zaczynamy od tej godziny
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

// Komponent pojedynczego bloku zmiany
function ShiftBlock({
	shift,
	onScheduleUpdate,
}: {
	shift: ScheduleShiftOut;
	onScheduleUpdate?: () => void;
}) {
	const [employeeNames, setEmployeeNames] = React.useState<
		Record<string, string>
	>({});
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [selectedSegment, setSelectedSegment] = React.useState<{
		employee: ShiftAssignedEmployeeOut;
		segment: ShiftEmployeeSegmentOut;
		employeeName: string;
	} | null>(null);
	const [splitShift, setSplitShift] = React.useState(false);
	const [newStartTime, setNewStartTime] = React.useState('');
	const [newEndTime, setNewEndTime] = React.useState('');
	const [splitTime, setSplitTime] = React.useState('');

	const topOffset = timeToPixels(shift.start);
	const bottomOffset = timeToPixels(shift.end);
	const slotHeight = bottomOffset - topOffset;

	// Sprawdź czy mamy szczegółowe informacje o pracownikach
	const hasEmployeeDetails =
		shift.assigned_employees_detail &&
		shift.assigned_employees_detail.length > 0;

	const style = {
		top: `${topOffset}px`,
		height: `${slotHeight}px`,
	};

	// Pobierz imiona i nazwiska pracowników
	React.useEffect(() => {
		if (!hasEmployeeDetails) return;

		const fetchNames = async () => {
			const names: Record<string, string> = {};
			for (const employee of shift.assigned_employees_detail!) {
				try {
					const details = await fetchEmployeeDetails(
						employee.employee_id
					);
					names[
						employee.employee_id
					] = `${details.first_name} ${details.last_name}`;
				} catch (error) {
					console.error(
						`Failed to fetch employee ${employee.employee_id}:`,
						error
					);
					names[employee.employee_id] =
						employee.employee_name || 'N/A';
				}
			}
			setEmployeeNames(names);
		};

		fetchNames();
	}, [shift.assigned_employees_detail, hasEmployeeDetails]);

	// Jeśli mamy szczegóły, renderuj segmenty pracowników + nieobsadzone jako osobne prostokąty
	if (hasEmployeeDetails) {
		// Oblicz całkowity czas zmiany w minutach
		const totalMinutes =
			((timeToPixels(shift.end) - timeToPixels(shift.start)) /
				HOUR_HEIGHT) *
			60;
		const staffedMinutes = totalMinutes - shift.missing_minutes;

		return (
			<div style={style} className='absolute inset-x-1'>
				{/* Renderuj segmenty każdego pracownika */}
				{shift.assigned_employees_detail!.map((employee, empIdx) => (
					<React.Fragment key={`${employee.employee_id}-${empIdx}`}>
						{employee.segments.map((segment, segIdx) => {
							const segmentTop =
								timeToPixels(segment.start) - topOffset;
							const segmentHeight =
								timeToPixels(segment.end) -
								timeToPixels(segment.start) -
								4;

							const employeeName =
								employeeNames[employee.employee_id] ||
								'Ładowanie...';

							return (
								<div
									key={`${empIdx}-${segIdx}`}
									className={`absolute inset-x-0 bg-blue-500/90 dark:bg-blue-600/80 rounded-sm flex items-center justify-center text-white font-medium px-1 cursor-pointer hover:bg-blue-600/90 dark:hover:bg-blue-700/80 transition-colors`}
									style={{
										top: `${segmentTop}px`,
										height: `${segmentHeight}px`,
									}}
									onClick={(e) => {
										e.stopPropagation();
										setSelectedSegment({
											employee,
											segment,
											employeeName,
										});
										setNewStartTime(segment.start);
										setNewEndTime(segment.end);
										setSplitShift(false);
										setSplitTime('');
										setDialogOpen(true);
									}}>
									{segmentHeight > 30 && (
										<div className='text-center overflow-hidden text-xs'>
											<div className='font-bold'>
												{employeeName}
											</div>
											<div className='text-[10px] mt-0.5'>
												{segment.start} - {segment.end}
											</div>
										</div>
									)}
								</div>
							);
						})}
					</React.Fragment>
				))}

				{/* Nieobsadzona część jako osobny pomarańczowy prostokąt */}
				{shift.missing_segments &&
					shift.missing_segments.length > 0 && (
						<>
							{shift.missing_segments.map((segment, idx) => {
								const segmentTop =
									timeToPixels(segment.start) - topOffset;
								const segmentHeight =
									timeToPixels(segment.end) -
									timeToPixels(segment.start) -
									4;

								return (
									<div
										key={`missing-${idx}`}
										className='absolute inset-x-0 bg-orange-500/90 dark:bg-orange-600/80 rounded-sm flex items-center justify-center text-white font-medium px-1'
										style={{
											top: `${segmentTop}px`,
											height: `${segmentHeight}px`,
										}}>
										{segmentHeight > 30 && (
											<div className='text-center text-xs'>
												<div className='font-bold'>
													{segment.start} -{' '}
													{segment.end}
												</div>
												<div className='text-[10px] mt-0.5'>
													Brak pracownika
												</div>
											</div>
										)}
									</div>
								);
							})}
						</>
					)}

				{/* Dialog do edycji segmentu */}
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Zmień godziny zmiany</DialogTitle>
						</DialogHeader>
						<div className='space-y-4 py-4'>
							{selectedSegment && (
								<div className='text-sm text-muted-foreground mb-4'>
									Edycja zmiany:{' '}
									{selectedSegment.employeeName}
								</div>
							)}

							<div className='space-y-2'>
								<Label htmlFor='start-time'>
									Godzina rozpoczęcia
								</Label>
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
								<Label htmlFor='end-time'>
									Godzina zakończenia
								</Label>
								<Input
									id='end-time'
									type='time'
									value={newEndTime}
									onChange={(e) =>
										setNewEndTime(e.target.value)
									}
								/>
							</div>

							<div className='flex items-center space-x-2'>
								<input
									type='checkbox'
									id='split-shift'
									checked={splitShift}
									onChange={(e) =>
										setSplitShift(e.target.checked)
									}
									className='w-4 h-4'
								/>
								<Label htmlFor='split-shift'>
									Podziel zmianę
								</Label>
							</div>

							{splitShift && (
								<div className='space-y-2 pl-6 border-l-2 border-gray-200 dark:border-gray-700'>
									<Label htmlFor='split-time'>
										O której godzinie zrobić podział?
									</Label>
									<Input
										id='split-time'
										type='time'
										value={splitTime}
										onChange={(e) =>
											setSplitTime(e.target.value)
										}
										placeholder='np. 12:00'
									/>
								</div>
							)}

							<div className='flex justify-end space-x-2 pt-4'>
								<Button
									variant='outline'
									onClick={() => setDialogOpen(false)}>
									Anuluj
								</Button>
								<Button
									onClick={async () => {
										if (!selectedSegment) return;

										try {
											const updatedEmployeesDetail: ShiftAssignedEmployeeIn[] =
												shift.assigned_employees_detail!.map(
													(emp) => {
														if (
															emp.employee_id ===
															selectedSegment
																.employee
																.employee_id
														) {
															// Aktualizuj segmenty dla wybranego pracownika
															if (
																splitShift &&
																splitTime
															) {
																// Podziel segment na dwa
																const newSegments: ShiftEmployeeSegmentIn[] =
																	[
																		{
																			start: newStartTime,
																			end: splitTime,
																		},
																		{
																			start: splitTime,
																			end: newEndTime,
																		},
																	];
																return {
																	employee_id:
																		emp.employee_id,
																	employee_name:
																		selectedSegment.employeeName,
																	segments:
																		newSegments,
																};
															} else {
																// Tylko zmień godziny
																const newSegments: ShiftEmployeeSegmentIn[] =
																	[
																		{
																			start: newStartTime,
																			end: newEndTime,
																		},
																	];
																return {
																	employee_id:
																		emp.employee_id,
																	employee_name:
																		selectedSegment.employeeName,
																	segments:
																		newSegments,
																};
															}
														}
														// Pozostaw innych pracowników bez zmian
														return {
															employee_id:
																emp.employee_id,
															employee_name:
																emp.employee_name,
															segments:
																emp.segments,
														};
													}
												);

											const shiftUpdate: ShiftUpdateIn = {
												id: shift.id,
												date: shift.date,
												location: shift.location,
												start: shift.start,
												end: shift.end,
												demand: shift.demand,
												assigned_employees:
													shift.assigned_employees,
												assigned_employees_detail:
													updatedEmployeesDetail,
												missing_segments:
													shift.missing_segments,
												missing_minutes:
													shift.missing_minutes,
											};

											console.log(
												'Wysyłam dane do updateShift:',
												{
													shiftId: shift.id,
													shiftUpdate,
												}
											);

											await updateShift(shiftUpdate);
											setDialogOpen(false);

											// Odśwież grafik po zapisaniu
											if (onScheduleUpdate) {
												onScheduleUpdate();
											}
										} catch (error) {
											console.error(
												'Failed to update shift:',
												error
											);
											// Tutaj możesz dodać powiadomienie o błędzie
										}
									}}>
									Zapisz
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	}

	return (
		<div
			style={style}
			className='absolute inset-x-1 bg-orange-500/80 dark:bg-orange-600/70 border border-orange-600 rounded-sm flex flex-col items-center justify-center text-xs font-medium text-white p-1 cursor-default'
			title={`Zapotrzebowanie: ${shift.demand} pracowników\nBrak przypisanych`}>
			<span className='font-bold text-[11px]'>
				{shift.start} - {shift.end}
			</span>
			<span className='text-[10px] mt-0.5'>
				Potrzeba: {shift.demand} os.
			</span>
		</div>
	);
}

// Komponent kolumny dnia
function DayColumn({
	date,
	shifts,
	onScheduleUpdate,
}: {
	date: Date;
	shifts: ScheduleShiftOut[];
	onScheduleUpdate?: () => void;
}) {
	return (
		<div
			className='relative'
			style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
			{shifts.map((shift) => (
				<ShiftBlock
					key={shift.id}
					shift={shift}
					onScheduleUpdate={onScheduleUpdate}
				/>
			))}
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
			});

			const names: Record<string, string> = {};
			for (const employeeId of uniqueEmployeeIds) {
				try {
					const details = await fetchEmployeeDetails(employeeId);
					names[
						employeeId
					] = `${details.first_name} ${details.last_name}`;
				} catch (error) {
					console.error(
						`Failed to fetch employee ${employeeId}:`,
						error
					);
					names[employeeId] = 'Nieznany pracownik';
				}
			}
			setEmployeeNames(names);
		};

		fetchAllEmployeeNames();
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
					employeeNames[employee.employee_id] || 'Ładowanie...';
				const employeeId = employee.employee_id;

				// Oblicz godziny dla tego pracownika w tej zmianie
				let totalMinutes = 0;
				employee.segments.forEach((segment) => {
					const [startH, startM] = segment.start
						.split(':')
						.map(Number);
					const [endH, endM] = segment.end.split(':').map(Number);
					const startMinutes = startH * 60 + startM;
					const endMinutes = endH * 60 + endM;
					totalMinutes += endMinutes - startMinutes;
				});

				const hours = totalMinutes / 60;

				if (hoursMap.has(employeeId)) {
					const current = hoursMap.get(employeeId)!;
					current.hours += hours;
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
								{weekDays.map((day, dayIdx) => (
									<div
										key={`${dayIdx}-${hour}`}
										className='border-r last:border-r-0 border-b'
										style={{
											height: `${HOUR_HEIGHT}px`,
										}}
									/>
								))}
							</React.Fragment>
						))}
					</div>

					{/* Renderujemy wszystkie zmiany jako osobne absolutnie pozycjonowane bloki */}
					<div
						className='grid grid-cols-8 relative'
						style={{
							marginTop: `-${hours.length * HOUR_HEIGHT}px`,
						}}>
						{/* Pusta kolumna dla godzin */}
						<div />

						{/* Kolumny dla każdego dnia z zmianami */}
						{weekDays.map((day, dayIdx) => {
							const dayShifts = getShiftsForDay(
								day,
								scheduleData
							);
							return (
								<DayColumn
									key={dayIdx}
									date={day}
									shifts={dayShifts}
									onScheduleUpdate={onScheduleUpdate}
								/>
							);
						})}
					</div>
				</div>
			</div>

			{/* Legenda */}
			<div className='mt-4 flex items-center gap-4 text-sm flex-wrap'>
				<div className='flex items-center gap-2'>
					<div className='w-4 h-4 bg-blue-500/80 dark:bg-blue-600/70 rounded border border-blue-600' />
					<span className='text-muted-foreground'>
						Pracownik przypisany
					</span>
				</div>
				<div className='flex items-center gap-2'>
					<div className='w-4 h-4 bg-orange-500/80 dark:bg-orange-600/70 rounded border border-orange-600' />
					<span className='text-muted-foreground'>
						Zapotrzebowanie (brak pracowników)
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
