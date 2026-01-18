/** @format */
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
	fetchCompanyCode,
	generateCompanyCode,
	fetchEmployees,
} from '@/lib/actions';
import { EyeClosed, EyeIcon } from 'lucide-react';
import { useAlert } from '@/providers/alert-provider';
import type { components } from '@/lib/types/openapi';
import { useTranslations } from 'next-intl';
import { useUser } from '@/providers/user-provider';

type CompanyCodeResponse = components['schemas']['CompanyCode'];

export default function AddEmployeeSection() {
	const t = useTranslations('Admin');
	const { isOwner } = useUser();
	const [companyCode, setCompanyCode] = useState<CompanyCodeResponse | null>(
		null,
	);
	const [employeeCount, setEmployeeCount] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const [isDataLoading, setIsDataLoading] = useState(true);
	const [showCode, setShowCode] = useState(false);
	const { showAlert } = useAlert();

	useEffect(() => {
		const loadData = async () => {
			try {
				const [codeData, employees] = await Promise.all([
					fetchCompanyCode(),
					fetchEmployees(),
				]);
				setCompanyCode(codeData);
				setEmployeeCount(employees.length);
			} catch {
				showAlert({ variant: 'error', title: t('loadError') });
			} finally {
				setIsDataLoading(false);
			}
		};
		loadData();
	}, [showAlert, t]);

	const handleGenerateCode = async () => {
		setLoading(true);
		try {
			const data = await generateCompanyCode();
			setCompanyCode(data);
			showAlert({
				variant: 'success',
				title: t('codeGeneratedSuccess'),
			});
		} catch {
			showAlert({
				variant: 'error',
				title: t('codeGenerateError'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className='w-[70%] lg:w-1/3 px-8 py-8'>
			<div className='flex justify-between items-center'>
				<div>
					<h3 className='font-semibold text-base'>
						{t('currentEmployeesCount')}
					</h3>
					<p className='text-sm font-semibold text-zinc-700'>
						{t('addNewEmployee')}
					</p>
				</div>
				<div className='text-6xl font-medium text-muted-foreground'>
					{isDataLoading ? (
						<Spinner className='h-12 w-12' />
					) : (
						employeeCount
					)}
				</div>
			</div>

			<div className='flex items-center gap-3'>
				<span className='font-semibold text-lg '>
					{t('companyCode')}
				</span>
				{companyCode?.company_code ? (
					showCode ? (
						<>
							<span className='text-3xl font-bold text-muted-foreground font-mono tracking-wide'>
								{companyCode.company_code}
							</span>
							<button
								onClick={() => setShowCode(false)}
								className='hover:opacity-70 transition-opacity'>
								<EyeClosed className='w-5 h-5' />
							</button>
						</>
					) : (
						<button
							onClick={() => setShowCode(true)}
							className='hover:opacity-70 transition-opacity'>
							<EyeIcon className='w-5 h-5' />
						</button>
					)
				) : (
					<span className='text-sm text-muted-foreground'>
						{t('noCode')}
					</span>
				)}
			</div>

			{isOwner && (
				<Button
					onClick={handleGenerateCode}
					disabled={loading}
					className='bg-black text-white hover:bg-black/90 w-1/2'>
					{loading && <Spinner className='mr-2 h-4 w-4' />}
					{companyCode ? t('generateNewCode') : t('generateCode')}
				</Button>
			)}
		</Card>
	);
}
