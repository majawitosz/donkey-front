'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitAttendanceCorrection } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const formSchema = z.object({
    timestamp: z.string().min(1, 'Time is required'),
    type: z.enum(['check_in', 'check_out']),
    reason: z.string().min(1, 'Reason is required'),
});

export default function CorrectionForm() {
    const t = useTranslations('Attendance');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'check_in',
            reason: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            await submitAttendanceCorrection(values);
            setSuccess(true);
            form.reset();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-card">
            <h3 className="text-lg font-semibold mb-4">{t('requestCorrection')}</h3>
            {success ? (
                <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
                    {t('correctionSuccess')}
                    <Button variant="link" onClick={() => setSuccess(false)} className="ml-2 p-0 h-auto">{t('submitAnother')}</Button>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('type')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectType')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="check_in">{t('checkIn')}</SelectItem>
                                            <SelectItem value="check_out">{t('checkOut')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="timestamp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('time')}</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('reason')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectReason')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="gps_error">{t('gpsError')}</SelectItem>
                                            <SelectItem value="no_phone">{t('noPhone')}</SelectItem>
                                            <SelectItem value="remote_work">{t('remoteWork')}</SelectItem>
                                            <SelectItem value="forgot">{t('forgot')}</SelectItem>
                                            <SelectItem value="other">{t('other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('submitRequest')}
                        </Button>
                    </form>
                </Form>
            )}
        </div>
    );
}
