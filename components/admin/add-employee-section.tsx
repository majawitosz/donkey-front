/** @format */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	fetchCompanyCode,
	generateCompanyCode,
	resetCompanyCode,
	fetchEmployeeCount,
} from '@/lib/actions';
import { useAlert } from '@/providers/alert-provider';

export default function AddEmployeeSection() {
	const [companyCode, setCompanyCode] = useState<string | null>(null);
	const [employeeCount, setEmployeeCount] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const { showAlert } = useAlert();

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const [codeData, countData] = await Promise.all([
				fetchCompanyCode(),
				fetchEmployeeCount(),
			]);
			setCompanyCode(codeData.code);
			setEmployeeCount(countData.count);
		} catch (error) {
			showAlert({ variant: 'error', title: 'Error loading data' });
		}
	};

	const handleGenerateCode = async () => {
		setLoading(true);
		try {
			const data = await generateCompanyCode();
			setCompanyCode(data.code);
			showAlert({
				variant: 'success',
				title: 'Company code generated successfully',
			});
		} catch (error) {
			showAlert({
				variant: 'error',
				title: 'Failed to generate company code',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleResetCode = async () => {
		setLoading(true);
		try {
			const data = await resetCompanyCode();
			setCompanyCode(data.code);
			showAlert({
				variant: 'success',
				title: 'Company code reset successfully',
			});
		} catch (error) {
			showAlert({
				variant: 'error',
				title: 'Failed to reset company code',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Dodaj nowego pracownika</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					<div>
						<p className='text-sm text-muted-foreground'>
							Aktualna liczba pracowników: {employeeCount}
						</p>
					</div>
					<div>
						<p className='text-sm font-medium'>Business Code:</p>
						<p className='text-lg font-mono bg-muted p-2 rounded'>
							{companyCode || 'Brak kodu'}
						</p>
					</div>
					<div className='flex gap-2'>
						<Button onClick={handleGenerateCode} disabled={loading}>
							{companyCode
								? 'Wygeneruj nowy kod'
								: 'Wygeneruj kod'}
						</Button>
						<Button
							variant='outline'
							onClick={handleResetCode}
							disabled={loading || !companyCode}>
							Zresetuj kod
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
