'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { registerAttendanceEvent } from '@/lib/actions';
import { Loader2, MapPin } from 'lucide-react';

export default function WebCheckIn() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleCheckIn = async (type: 'check_in' | 'check_out') => {
        setLoading(true);
        setStatus('idle');
        setMessage('');

        if (!navigator.geolocation) {
            setStatus('error');
            setMessage('Geolocation is not supported by your browser.');
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
                        setMessage(`Pomyślnie ${type === 'check_in' ? 'rozpoczęto pracę' : 'zakończono pracę'}!`);
                    } else {
                        setStatus('error');
                        const errorDetail = result.error?.detail || result.error;
                        
                        if (errorDetail === 'Location is outside of workplace radius.') {
                            const distance = result.error?.distance ? Math.round(result.error.distance) : 'nieznana';
                            const radius = result.error?.radius ? Math.round(result.error.radius) : 'nieznany';
                            setMessage(`Jesteś poza strefą pracy. Twoja odległość: ${distance}m, dozwolony promień: ${radius}m.`);
                        } else if (errorDetail === 'Company location not configured.') {
                            setMessage('Lokalizacja firmy nie została skonfigurowana. Skontaktuj się z administratorem.');
                        } else {
                            setMessage('Nie udało się zarejestrować obecności. Spróbuj ponownie.');
                        }
                    }
                } catch (error) {
                    setStatus('error');
                    setMessage('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                setStatus('error');
                setMessage(`Błąd lokalizacji: ${error.message}`);
                setLoading(false);
            }
        );
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-card">
            <h3 className="text-lg font-semibold mb-4">Rejestracja czasu pracy (Web)</h3>
            <div className="flex gap-4">
                <Button 
                    onClick={() => handleCheckIn('check_in')} 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Start Pracy
                </Button>
                <Button 
                    onClick={() => handleCheckIn('check_out')} 
                    disabled={loading}
                    variant="destructive"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Koniec Pracy
                </Button>
            </div>
            {message && (
                <div className={`mt-4 p-2 rounded text-sm ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
                Uwaga: Twoja lokalizacja zostanie zapisana. Upewnij się, że jesteś w strefie pracy.
            </p>
        </div>
    );
}
