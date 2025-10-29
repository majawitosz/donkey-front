/** @format */
'use client';

import { useState, useEffect } from 'react';
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
	CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
	fetchCompanyCode,
	generateCompanyCode,
	fetchEmployees,
} from '@/lib/actions';
import { useAlert } from '@/providers/alert-provider';
import type { components } from '@/lib/types/openapi';

type CompanyCodeResponse = components['schemas']['CompanyCode'];

export default function AddEmployeeSection() {
	const [companyCode, setCompanyCode] = useState<CompanyCodeResponse | null>(
		null
	);
	const [employeeCount, setEmployeeCount] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const { showAlert } = useAlert();

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const [codeData, employees] = await Promise.all([
				fetchCompanyCode(),
				fetchEmployees(),
			]);
			setCompanyCode(codeData);
			setEmployeeCount(employees.length);
		} catch (error) {
			showAlert({ variant: 'error', title: 'Error loading data' });
		}
	};

	const handleGenerateCode = async () => {
		setLoading(true);
		try {
			const data = await generateCompanyCode();
			setCompanyCode(data);
			showAlert({
				variant: 'success',
				title: 'Kod firmowy wygenerowany pomyślnie',
			});
		} catch (error) {
			showAlert({
				variant: 'error',
				title: 'Nie udało się wygenerować kodu',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-xl font-semibold tabular-nums @[250px]/card:text-3xl'>
					Dodaj nowego pracownika
				</CardTitle>
			</CardHeader>

			<CardContent>
				<div className='space-y-4'>
					<div>
						<p className='text-sm font-medium'>Kod firmowy:</p>
						<p className='text-lg font-mono bg-muted p-2 rounded'>
							{companyCode?.company_code || 'Brak kodu'}
						</p>
					</div>
					<div>
						{loading ? (
							<Button disabled size='sm'>
								<Spinner />
								Ładowanie...
							</Button>
						) : (
							<Button onClick={handleGenerateCode}>
								{companyCode
									? 'Wygeneruj nowy kod'
									: 'Wygeneruj kod'}
							</Button>
						)}
					</div>
				</div>
			</CardContent>
			<CardFooter className='flex-col items-start gap-1.5 text-sm'>
				<div className='line-clamp-1 flex gap-2 font-medium'>
					Aktualna liczba pracowników
				</div>
				<div className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
					{employeeCount}
				</div>
			</CardFooter>
		</Card>
	);
}
