import { getAttendanceHistory, getWorkplaceConfig } from '@/lib/actions';
import AttendanceTable from '@/components/attendance/attendance-table';
import WorkZoneMap from '@/components/attendance/work-zone-map';
import WebCheckIn from '@/components/attendance/web-check-in';
import CorrectionForm from '@/components/attendance/correction-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AttendancePage() {
    const [history, config] = await Promise.all([
        getAttendanceHistory(),
        getWorkplaceConfig(),
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance History</CardTitle>
                            <CardDescription>
                                Your recent check-ins and check-outs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttendanceTable events={history} workplaceConfig={config} />
                        </CardContent>
                    </Card>
                </div>
                <div className="col-span-3 space-y-4">
                    <WebCheckIn />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Work Zone</CardTitle>
                            <CardDescription>
                                Your assigned work location and geofence.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {config ? (
                                <WorkZoneMap config={config} />
                            ) : (
                                <p>Workplace configuration not available.</p>
                            )}
                        </CardContent>
                    </Card>

                    <CorrectionForm />

                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy & Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                System pobiera Twoją lokalizację tylko w momencie kliknięcia przycisku Start/Stop w aplikacji mobilnej lub webowej. 
                                Nie śledzimy Twojej trasy w trakcie pracy ani po godzinach.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
