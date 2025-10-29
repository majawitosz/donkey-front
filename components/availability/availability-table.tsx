/** @format */
'use client';
import * as React from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { fetchAvailability, fetchEmployees } from '@/lib/actions';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { components } from '@/lib/types/openapi';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeeklyAvailabilityView from './weekly-availability-view';

type AvailabilityOut = components['schemas']['AvailabilityOut'];
type UserDetail = components['schemas']['UserList'];

// Grupujemy dane po pracowniku
type EmployeeAvailability = {
	employee_id: string;
	employee_name: string;
	experienced: boolean;
	hours_min: number;
	hours_max: number;
	dates: string[];
	hasSubmitted: boolean;
};

export default function AvailabilityTable() {
	const [employees, setEmployees] = React.useState<EmployeeAvailability[]>(
		[]
	);
	const [loading, setLoading] = React.useState(true);
	const [currentWeekStart, setCurrentWeekStart] = React.useState<Date>(() =>
		startOfWeek(new Date(), { locale: pl, weekStartsOn: 1 })
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [selectedEmployee, setSelectedEmployee] = React.useState<{
		id: string;
		name: string;
	} | null>(null);
	const [availabilityData, setAvailabilityData] = React.useState<
		AvailabilityOut[]
	>([]);

	const currentWeekEnd = endOfWeek(currentWeekStart, {
		locale: pl,
		weekStartsOn: 1,
	});

	const columns: ColumnDef<EmployeeAvailability>[] = [
		{
			accessorKey: 'employee_name',
			header: 'Pracownik',
			cell: ({ row }) => (
				<div className='font-medium'>
					{row.getValue('employee_name')}
				</div>
			),
		},
		{
			accessorKey: 'experienced',
			header: 'Doświadczony',
			cell: ({ row }) => (
				<div>
					{row.getValue('experienced') ? (
						<span className='text-green-600'>Tak</span>
					) : (
						<span className='text-muted-foreground'>Nie</span>
					)}
				</div>
			),
		},
		{
			accessorKey: 'hours_min',
			header: 'Min. godz.',
			cell: ({ row }) => <div>{row.getValue('hours_min')}</div>,
		},
		{
			accessorKey: 'hours_max',
			header: 'Maks. godz.',
			cell: ({ row }) => <div>{row.getValue('hours_max')}</div>,
		},
		{
			accessorKey: 'hasSubmitted',
			header: 'Status',
			cell: ({ row }) => (
				<div>
					{row.getValue('hasSubmitted') ? (
						<span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200'>
							Wysłano
						</span>
					) : (
						<span className='inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
							Oczekuje
						</span>
					)}
				</div>
			),
		},
		{
			id: 'actions',
			header: 'Akcje',
			cell: ({ row }) => {
				const employee = row.original;
				return (
					<Button
						variant='ghost'
						size='sm'
						disabled={!employee.hasSubmitted}
						onClick={() => {
							setSelectedEmployee({
								id: employee.employee_id,
								name: employee.employee_name,
							});
						}}>
						<Eye className='mr-2 h-4 w-4' />
						Szczegóły
					</Button>
				);
			},
		},
	];

	const loadAvailability = React.useCallback(async (weekStart: Date) => {
		setLoading(true);
		try {
			const weekEnd = endOfWeek(weekStart, {
				locale: pl,
				weekStartsOn: 1,
			});

			// Pobieramy dane o dostępności i pracownikach równolegle
			const [availabilityData, employeesData] = await Promise.all([
				fetchAvailability({
					date_from: format(weekStart, 'yyyy-MM-dd'),
					date_to: format(weekEnd, 'yyyy-MM-dd'),
				}),
				fetchEmployees(),
			]);

			// Tworzymy mapę employee_id -> nazwa pracownika
			const employeeNamesMap = new Map<string, string>();
			employeesData.forEach((emp) => {
				const fullName = `${emp.first_name} ${emp.last_name}`.trim();
				employeeNamesMap.set(String(emp.id), fullName);
			});

			// Grupujemy dane po pracownikach
			const employeeMap = new Map<string, EmployeeAvailability>();

			availabilityData.forEach((item) => {
				if (!employeeMap.has(item.employee_id)) {
					const employeeName =
						employeeNamesMap.get(item.employee_id) ||
						item.employee_name ||
						'Nieznany pracownik';

					employeeMap.set(item.employee_id, {
						employee_id: item.employee_id,
						employee_name: employeeName,
						experienced: item.experienced,
						hours_min: item.hours_min,
						hours_max: item.hours_max,
						dates: [],
						hasSubmitted: false,
					});
				}

				const employee = employeeMap.get(item.employee_id)!;
				employee.dates.push(item.date);
				if (item.available_slots && item.available_slots.length > 0) {
					employee.hasSubmitted = true;
				}
			});

			setEmployees(Array.from(employeeMap.values()));
			// Zapisujemy dane dostępności dla późniejszego użycia w szczegółowym widoku
			setAvailabilityData(availabilityData);
		} catch (error) {
			console.error('Error fetching availability:', error);
			setEmployees([]);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadAvailability(currentWeekStart);
	}, [currentWeekStart, loadAvailability]);

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

	const table = useReactTable({
		data: employees,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Dostępność pracowników</CardTitle>
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
						<Button
							variant='outline'
							onClick={handleCurrentWeek}
							disabled={loading}>
							Obecny tydzień
						</Button>
					</div>

					{loading ? (
						<div className='flex items-center justify-center py-12'>
							<Spinner className='size-8' />
						</div>
					) : (
						<>
							<div className='overflow-hidden rounded-md border'>
								<Table>
									<TableHeader>
										{table
											.getHeaderGroups()
											.map((headerGroup) => (
												<TableRow key={headerGroup.id}>
													{headerGroup.headers.map(
														(header) => {
															return (
																<TableHead
																	key={
																		header.id
																	}>
																	{header.isPlaceholder
																		? null
																		: flexRender(
																				header
																					.column
																					.columnDef
																					.header,
																				header.getContext()
																		  )}
																</TableHead>
															);
														}
													)}
												</TableRow>
											))}
									</TableHeader>
									<TableBody>
										{table.getRowModel().rows?.length ? (
											table
												.getRowModel()
												.rows.map((row) => (
													<TableRow key={row.id}>
														{row
															.getVisibleCells()
															.map((cell) => (
																<TableCell
																	key={
																		cell.id
																	}>
																	{flexRender(
																		cell
																			.column
																			.columnDef
																			.cell,
																		cell.getContext()
																	)}
																</TableCell>
															))}
													</TableRow>
												))
										) : (
											<TableRow>
												<TableCell
													colSpan={columns.length}
													className='h-24 text-center'>
													Brak danych dla tego
													tygodnia.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
							<div className='mt-4 flex items-center justify-between text-sm text-muted-foreground'>
								<div>
									Łącznie: {table.getRowModel().rows.length}{' '}
									pracowników
								</div>
								<div>
									Wysłano dyspozycje:{' '}
									{
										employees.filter((e) => e.hasSubmitted)
											.length
									}{' '}
									/ {employees.length}
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Szczegółowy widok dostępności pracownika */}
			{selectedEmployee && (
				<WeeklyAvailabilityView
					employeeName={selectedEmployee.name}
					employeeId={selectedEmployee.id}
					weekStart={currentWeekStart}
					availabilityData={availabilityData}
					onClose={() => setSelectedEmployee(null)}
				/>
			)}
		</>
	);
}
