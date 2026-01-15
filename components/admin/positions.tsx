/** @format */
'use client';

import * as React from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
	fetchPositions,
	createPosition,
	updatePosition,
	deletePosition,
} from '@/lib/actions';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import type { components } from '@/lib/types/openapi';
import { Spinner } from '../ui/spinner';
import { useTranslations } from 'next-intl';

type Position = components['schemas']['Position'];

export default function PositionsPage() {
	const t = useTranslations('Positions');
	const [positions, setPositions] = React.useState<Position[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [editingPosition, setEditingPosition] =
		React.useState<Position | null>(null);
	const [name, setName] = React.useState('');

	const loadPositions = React.useCallback(async () => {
		try {
			const data = await fetchPositions();
			setPositions(data);
		} catch (error) {
			console.error('Error fetching positions:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadPositions();
	}, [loadPositions]);

	const handleCreate = async () => {
		if (!name.trim()) return;
		try {
			await createPosition(name.trim());
			setName('');
			setDialogOpen(false);
			loadPositions();
		} catch (error) {
			console.error('Error creating position:', error);
		}
	};

	const handleUpdate = async () => {
		if (!editingPosition || !name.trim()) return;
		try {
			await updatePosition(editingPosition.id, name.trim());
			setName('');
			setDialogOpen(false);
			setEditingPosition(null);
			loadPositions();
		} catch (error) {
			console.error('Error updating position:', error);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await deletePosition(id);
			loadPositions();
		} catch (error) {
			console.error('Error deleting position:', error);
		}
	};

	const openEditDialog = (position: Position) => {
		setEditingPosition(position);
		setName(position.name);
		setDialogOpen(true);
	};

	const openCreateDialog = () => {
		setEditingPosition(null);
		setName('');
		setDialogOpen(true);
	};

	const closeDialog = () => {
		setDialogOpen(false);
		setEditingPosition(null);
		setName('');
	};

	if (loading) {
		return (
			<div className='flex items-center gap-8 justify-center min-h-svh'>
				<Spinner className='size-8' />
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('title')}</CardTitle>
				<CardDescription>{t('description')}</CardDescription>

				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={openCreateDialog}>
							<Plus className='mr-2 h-4 w-4' />
							{t('addPosition')}
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>
								{editingPosition
									? t('editPosition')
									: t('addPosition')}
							</DialogTitle>
							<DialogDescription>
								{editingPosition
									? t('changeName')
									: t('enterName')}
							</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
							<div className='grid grid-cols-4 items-center gap-4'>
								<Label htmlFor='name' className='text-right'>
									{t('name')}
								</Label>
								<Input
									id='name'
									value={name}
									onChange={(e) => setName(e.target.value)}
									className='col-span-3'
									placeholder={t('namePlaceholder')}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={closeDialog}>
								{t('cancel')}
							</Button>
							<Button
								type='button'
								onClick={
									editingPosition
										? handleUpdate
										: handleCreate
								}
								disabled={!name.trim()}>
								{editingPosition ? t('save') : t('add')}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardHeader>

			<div className='rounded-md border m-10 '>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t('name')}</TableHead>
							<TableHead>{t('createdAt')}</TableHead>
							<TableHead className='text-right'>
								{t('actions')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{positions.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className='text-center'>
									{t('noPositions')}
								</TableCell>
							</TableRow>
						) : (
							positions.map((position) => (
								<TableRow key={position.id}>
									<TableCell>{position.name}</TableCell>
									<TableCell>
										{new Date(
											position.created_at
										).toLocaleDateString('pl-PL')}
									</TableCell>
									<TableCell className='text-right'>
										<Button
											variant='ghost'
											size='sm'
											onClick={() =>
												openEditDialog(position)
											}
											className='mr-2'>
											<Edit className='h-4 w-4' />
										</Button>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant='ghost'
													size='sm'>
													<Trash2 className='h-4 w-4' />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														{t('areYouSure')}
													</AlertDialogTitle>
													<AlertDialogDescription>
														{t('deleteWarning', {
															name: position.name,
														})}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>
														{t('cancel')}
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={() =>
															handleDelete(
																position.id
															)
														}>
														{t('delete')}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</Card>
	);
}
