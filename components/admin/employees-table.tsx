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
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetchEmployees } from '@/lib/actions';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
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

type Employee = components['schemas']['UserList'];

export const columns: ColumnDef<Employee>[] = [
	{
		accessorKey: 'email',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}>
					Email
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
		header: 'First Name',
		cell: ({ row }) => <div>{row.getValue('first_name')}</div>,
	},
	{
		accessorKey: 'last_name',
		header: 'Last Name',
		cell: ({ row }) => <div>{row.getValue('last_name')}</div>,
	},
	{
		accessorKey: 'role',
		header: 'Role',
		cell: ({ row }) => (
			<div className='capitalize'>{row.getValue('role')}</div>
		),
	},
	{
		accessorKey: 'created_at',
		header: 'Created At',
		cell: ({ row }) => {
			const date = new Date(row.getValue('created_at'));
			return <div>{date.toLocaleDateString()}</div>;
		},
	},
	{
		accessorKey: 'position_name',
		header: 'Position Name',
		cell: ({ row }) => <div>{row.getValue('position_name')}</div>,
	},
	{
		accessorKey: 'experience_years',
		header: 'Experience Years',
		cell: ({ row }) => <div>{row.getValue('experience_years')}</div>,
	},
	{
		accessorKey: 'notes',
		header: 'Notes',
		cell: ({ row }) => <div>{row.getValue('notes')}</div>,
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			const employee = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='ghost' className='h-8 w-8 p-0'>
							<span className='sr-only'>Open menu</span>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(
									employee.id.toString()
								)
							}>
							Copy employee ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View employee</DropdownMenuItem>
						<DropdownMenuItem>Edit employee</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

export default function EmployeesTable() {
	const [employees, setEmployees] = React.useState<Employee[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [search, setSearch] = React.useState('');
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});

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
		[]
	);

	React.useEffect(() => {
		loadEmployees(undefined, true);
	}, [loadEmployees]);

	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			loadEmployees(search, false);
		}, 300); // Debounce search
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
					placeholder='Search employees by email...'
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className='max-w-sm'
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='outline' className='ml-auto'>
							Columns <ChevronDown />
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
														header.getContext()
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
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className='flex items-center justify-end space-x-2 py-4'>
				<div className='text-muted-foreground flex-1 text-sm'>
					{table.getFilteredRowModel().rows.length} row(s) total.
				</div>
				<div className='space-x-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						Previous
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						Next
					</Button>
				</div>
			</div>
		</>
	);
}
