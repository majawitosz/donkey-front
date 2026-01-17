/** @format */
'use client';
import * as React from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, CircleChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetchEmployees } from '@/lib/actions';
import { Link } from '@/i18n/navigation';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { useTranslations } from 'next-intl';

type Employee = components['schemas']['UserList'];

export default function EmployeesTable() {
	const t = useTranslations('EmployeesTable');
	const [employees, setEmployees] = React.useState<Employee[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [search, setSearch] = React.useState('');
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});

	const columns = React.useMemo<ColumnDef<Employee>[]>(
		() => [
			{
				accessorKey: 'email',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === 'asc',
								)
							}>
							{t('email')}
							<ArrowUpDown />
						</Button>
					);
				},
				cell: ({ row }) => (
					<div className='lowercase'>{row.getValue('email')}</div>
				),
			},
			{
				accessorKey: 'first_name',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === 'asc',
								)
							}>
							{t('firstName')}
							<ArrowUpDown />
						</Button>
					);
				},
				cell: ({ row }) => <div>{row.getValue('first_name')}</div>,
			},
			{
				accessorKey: 'last_name',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === 'asc',
								)
							}>
							{t('lastName')}
							<ArrowUpDown />
						</Button>
					);
				},
				cell: ({ row }) => <div>{row.getValue('last_name')}</div>,
			},
			{
				accessorKey: 'role',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === 'asc',
								)
							}>
							{t('role')}
							<ArrowUpDown />
						</Button>
					);
				},
				cell: ({ row }) => (
					<div className='capitalize'>{row.getValue('role')}</div>
				),
			},
			{
				accessorKey: 'created_at',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === 'asc',
								)
							}>
							{t('createdAt')}
							<ArrowUpDown />
						</Button>
					);
				},
				cell: ({ row }) => {
					const date = new Date(row.getValue('created_at'));
					return <div>{date.toLocaleDateString()}</div>;
				},
			},
			{
				accessorKey: 'position_name',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === 'asc',
								)
							}>
							{t('positionName')}
							<ArrowUpDown />
						</Button>
					);
				},
				cell: ({ row }) => <div>{row.getValue('position_name')}</div>,
			},
			{
				accessorKey: 'experience_years',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === 'asc',
								)
							}>
							{t('experienceYears')}
							<ArrowUpDown />
						</Button>
					);
				},
				cell: ({ row }) => (
					<div>{row.getValue('experience_years')}</div>
				),
			},
			{
				id: 'actions',
				enableHiding: false,
				cell: ({ row }) => {
					const employee = row.original;

					return (
						<Button variant='ghost' asChild className='h-8 w-8 p-0'>
							<Link
								href={`/dashboard/admin/employees/${employee.id}`}>
								<CircleChevronRight className='h-4 w-4' />
								<span className='sr-only'>
									{t('editEmployee')}
								</span>
							</Link>
						</Button>
					);
				},
			},
		],
		[t],
	);

	const loadEmployees = React.useCallback(
		async (searchTerm?: string, isInitial = false) => {
			if (isInitial) setLoading(true);
			try {
				const data: Employee[] = await fetchEmployees(searchTerm);
				setEmployees(data);
			} catch (error) {
				console.error('Error fetching employees:', error);
			} finally {
				if (isInitial) setLoading(false);
			}
		},
		[],
	);

	React.useEffect(() => {
		loadEmployees(undefined, true);
	}, [loadEmployees]);

	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			loadEmployees(search, false);
		}, 300);
		return () => clearTimeout(timeoutId);
	}, [search, loadEmployees]);

	const table = useReactTable({
		data: employees,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
		},
	});

	if (loading) {
		return (
			<div className='flex items-center gap-8 justify-center min-h-svh'>
				<Spinner className='size-8' />
			</div>
		);
	}

	return (
		<>
			<div className='flex items-center py-4'>
				<Input
					placeholder={t('searchPlaceholder')}
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className='max-w-sm'
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='outline' className='ml-auto'>
							{t('columns')} <ChevronDown />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className='capitalize'
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)
										}>
										{column.id}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className='overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
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
									{t('noResults')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className='flex items-center justify-end space-x-2 py-4'>
				<div className='text-muted-foreground flex-1 text-sm'>
					{table.getFilteredRowModel().rows.length} {t('rowsTotal')}
				</div>
				<div className='space-x-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						{t('previous')}
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						{t('next')}
					</Button>
				</div>
			</div>
		</>
	);
}
