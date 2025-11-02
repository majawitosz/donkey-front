/** @format */
'use client';

import * as React from 'react';
import { format, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchEmployeeDetails } from '@/lib/actions';
import type { components } from '@/lib/types/openapi';

type GenerateResultOut = components['schemas']['GenerateResultOut'];
type ScheduleShiftOut = components['schemas']['ScheduleShiftOut'];
type ShiftAssignedEmployeeOut =
	components['schemas']['ShiftAssignedEmployeeOut'];
type ShiftEmployeeSegmentOut = components['schemas']['ShiftEmployeeSegmentOut'];
type UserDetail = components['schemas']['UserList'];

interface WeeklyScheduleViewProps {
	weekStart: Date;
	scheduleData: GenerateResultOut;
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

// Pobiera zmiany dla konkretnego dnia
const getShiftsForDay = (
	date: Date,
	scheduleData: GenerateResultOut
): ScheduleShiftOut[] => {
	const dateStr = format(date, 'yyyy-MM-dd');
	return scheduleData.assignments.filter((shift) => shift.date === dateStr);
};

// Komponent pojedynczego bloku zmiany
function ShiftBlock({ shift }: { shift: ScheduleShiftOut }) {
	const [employeeNames, setEmployeeNames] = React.useState<
		Record<string, string>
	>({});

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
								2; // Skróć o 2px

							const employeeName =
								employeeNames[employee.employee_id] ||
								'Ładowanie...';

							return (
								<div
									key={`${empIdx}-${segIdx}`}
									className={`absolute inset-x-0 bg-blue-500/90 dark:bg-blue-600/80 rounded-sm flex items-center justify-center text-white font-medium px-1`}
									style={{
										top: `${segmentTop}px`,
										height: `${segmentHeight}px`,
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
									2; // Skróć o 2px

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
}: {
	date: Date;
	shifts: ScheduleShiftOut[];
}) {
	return (
		<div
			className='relative'
			style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
			{shifts.map((shift) => (
				<ShiftBlock key={shift.id} shift={shift} />
			))}
		</div>
	);
}

export default function WeeklyScheduleView({
	weekStart,
	scheduleData,
}: WeeklyScheduleViewProps) {
	const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	return (
		<div>
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
			{scheduleData.summary && (
				<div className='mt-4 p-4 bg-muted/50 rounded-lg'>
					<h4 className='font-semibold mb-2'>Podsumowanie</h4>
					<pre className='text-xs'>
						{JSON.stringify(scheduleData.summary, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
