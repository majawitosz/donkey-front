'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { registerAttendanceEvent } from '@/lib/actions';
import { Loader2, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function WebCheckIn() {
    const t = useTranslations('Attendance');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleCheckIn = async (type: 'check_in' | 'check_out') => {
        setLoading(true);
        setStatus('idle');
        setMessage('');

        if (!navigator.geolocation) {
            setStatus('error');
            setMessage(t('geolocationNotSupported'));
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const result = await registerAttendanceEvent({
                        type,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        source: 'web',
                    });

                    if (result.success) {
                        setStatus('success');
                        setMessage(type === 'check_in' ? t('successStart') : t('successEnd'));
                    } else {
                        setStatus('error');
                        const errorDetail = result.error?.detail || result.error;
                        
                        if (errorDetail === 'Location is outside of workplace radius.') {
                            const distance = result.error?.distance ? Math.round(result.error.distance) : 'nieznana';
                            const radius = result.error?.radius ? Math.round(result.error.radius) : 'nieznany';
                            setMessage(t('outsideZoneError', { distance, radius }));
                        } else if (errorDetail === 'Company location not configured.') {
                            setMessage(t('configError'));
                        } else {
                            setMessage(t('registerError'));
                        }
                    }
                } catch (error) {
                    setStatus('error');
                    setMessage(t('unexpectedError'));
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                setStatus('error');
                setMessage(t('locationError', { message: error.message }));
                setLoading(false);
            }
        );
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-card">
            <h3 className="text-lg font-semibold mb-4">{t('webCheckInTitle')}</h3>
            <div className="flex gap-4">
                <Button 
                    onClick={() => handleCheckIn('check_in')} 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    {t('startWork')}
                </Button>
                <Button 
                    onClick={() => handleCheckIn('check_out')} 
                    disabled={loading}
                    variant="destructive"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    {t('endWork')}
                </Button>
            </div>
            {message && (
                <div className={`mt-4 p-2 rounded text-sm ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
                {t('locationWarning')}
            </p>
        </div>
    );
}
