/** @format */
'use client';

import * as React from 'react';
import { format, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DndContext,
	DragOverlay,
	useSensor,
	useSensors,
	PointerSensor,
	KeyboardSensor,
	DragStartEvent,
	DragEndEvent,
	closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { components } from '@/lib/types/openapi';

type GenerateResultOut = components['schemas']['GenerateResultOut'];
type ScheduleShiftOut = components['schemas']['ScheduleShiftOut'];

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

// Komponent pojedynczego bloku zmiany (draggable)
function ShiftBlock({
	shift,
	onDragStart,
}: {
	shift: ScheduleShiftOut;
	onDragStart?: () => void;
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: shift.id,
		data: shift,
	});

	const topOffset = timeToPixels(shift.start);
	const bottomOffset = timeToPixels(shift.end);
	const slotHeight = bottomOffset - topOffset;

	const isFullyStaffed = shift.missing_minutes === 0;
	const bgColor = isFullyStaffed
		? 'bg-blue-500/80 dark:bg-blue-600/70 border-blue-600'
		: 'bg-orange-500/80 dark:bg-orange-600/70 border-orange-600';

	const style = {
		top: `${topOffset}px`,
		height: `${slotHeight}px`,
		opacity: isDragging ? 0.3 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`absolute inset-x-1 ${bgColor} rounded-sm border flex flex-col items-center justify-center text-xs font-medium text-white p-1 cursor-move hover:opacity-90 transition-opacity touch-none`}
			title={`${shift.assigned_employees.length}/${
				shift.demand
			} pracowników\n${
				shift.assigned_employees.join(', ') || 'Brak przypisanych'
			}`}>
			<span className='font-bold text-[11px]'>
				{shift.start} - {shift.end}
			</span>
			<span className='text-[10px] mt-0.5'>
				{shift.assigned_employees.length} os.
				{shift.demand > shift.assigned_employees.length &&
					` (brak: ${
						shift.demand - shift.assigned_employees.length
					})`}
			</span>
			{shift.assigned_employees.length > 0 && (
				<div className='text-[9px] mt-1 text-center max-w-full overflow-hidden'>
					{shift.assigned_employees.slice(0, 2).join(', ')}
					{shift.assigned_employees.length > 2 &&
						` +${shift.assigned_employees.length - 2}`}
				</div>
			)}
		</div>
	);
}

// Komponent kolumny dnia (droppable)
function DayColumn({
	date,
	shifts,
	dayIdx,
}: {
	date: Date;
	shifts: ScheduleShiftOut[];
	dayIdx: number;
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `day-${format(date, 'yyyy-MM-dd')}`,
		data: { date, dayIdx },
	});

	return (
		<div
			ref={setNodeRef}
			className={`relative ${
				isOver ? 'bg-blue-100/20 dark:bg-blue-900/20' : ''
			}`}
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
	const [activeShift, setActiveShift] =
		React.useState<ScheduleShiftOut | null>(null);
	const [shifts, setShifts] = React.useState<ScheduleShiftOut[]>(
		scheduleData.assignments
	);

	// Aktualizuj stan gdy zmienią się dane z backendu
	React.useEffect(() => {
		setShifts(scheduleData.assignments);
	}, [scheduleData.assignments]);

	// Konfiguracja sensorów dla drag & drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // Wymaga przesunięcia o 8px żeby aktywować drag
			},
		}),
		useSensor(KeyboardSensor)
	);

	const handleDragStart = (event: DragStartEvent) => {
		const shift = shifts.find((s) => s.id === event.active.id);
		if (shift) {
			setActiveShift(shift);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over) {
			setActiveShift(null);
			return;
		}

		// Sprawdź czy upuszczono nad innym dniem
		if (over.id.toString().startsWith('day-')) {
			const newDate = over.id.toString().replace('day-', '');
			const shiftId = active.id;

			setShifts((prevShifts) =>
				prevShifts.map((shift) =>
					shift.id === shiftId ? { ...shift, date: newDate } : shift
				)
			);

			// TODO: Wyślij zmianę do backendu
			console.log('Zmiana przesunięta:', { shiftId, newDate });
		}

		setActiveShift(null);
	};

	const handleDragCancel = () => {
		setActiveShift(null);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}>
			<div>
				<div className='mb-4'>
					<h3 className='text-lg font-semibold'>
						Wygenerowany grafik
					</h3>
					<p className='text-sm text-muted-foreground'>
						Demand ID: {scheduleData.demand_id} | Łącznie zmian:{' '}
						{shifts.length}
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
								const dayShifts = getShiftsForDay(day, {
									...scheduleData,
									assignments: shifts,
								});
								return (
									<DayColumn
										key={dayIdx}
										date={day}
										shifts={dayShifts}
										dayIdx={dayIdx}
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
							Zmiana obsadzona
						</span>
					</div>
					<div className='flex items-center gap-2'>
						<div className='w-4 h-4 bg-orange-500/80 dark:bg-orange-600/70 rounded border border-orange-600' />
						<span className='text-muted-foreground'>
							Brak pracowników
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

			{/* DragOverlay - pokazuje podgląd przeciąganego elementu */}
			<DragOverlay>
				{activeShift ? (
					<div
						className={`${
							activeShift.missing_minutes === 0
								? 'bg-blue-500/90 dark:bg-blue-600/80 border-blue-600'
								: 'bg-orange-500/90 dark:bg-orange-600/80 border-orange-600'
						} rounded-sm border-2 flex flex-col items-center justify-center text-xs font-medium text-white p-2 shadow-2xl`}
						style={{
							width: '140px',
							height: `${
								timeToPixels(activeShift.end) -
								timeToPixels(activeShift.start)
							}px`,
							minHeight: '40px',
						}}>
						<span className='font-bold text-[11px]'>
							{activeShift.start} - {activeShift.end}
						</span>
						<span className='text-[10px] mt-0.5'>
							{activeShift.assigned_employees.length} os.
						</span>
						{activeShift.assigned_employees.length > 0 && (
							<div className='text-[9px] mt-1 text-center'>
								{activeShift.assigned_employees
									.slice(0, 2)
									.join(', ')}
								{activeShift.assigned_employees.length > 2 &&
									` +${
										activeShift.assigned_employees.length -
										2
									}`}
							</div>
						)}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
