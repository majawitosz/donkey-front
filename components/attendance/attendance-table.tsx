'use client';

import { useState } from 'react';
import { AttendanceEvent, WorkplaceConfig } from '@/lib/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import AttendanceMapModal from './attendance-map-modal';
import { format } from 'date-fns';

interface AttendanceTableProps {
    events: AttendanceEvent[];
    workplaceConfig: WorkplaceConfig | null;
}

export default function AttendanceTable({ events, workplaceConfig }: AttendanceTableProps) {
    const [selectedEvent, setSelectedEvent] = useState<AttendanceEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewLocation = (event: AttendanceEvent) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">No attendance records found.</TableCell>
                        </TableRow>
                    ) : (
                        events.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell>{format(new Date(event.timestamp), 'PPpp')}</TableCell>
                                <TableCell className="capitalize">{event.type.replace('_', ' ')}</TableCell>
                                <TableCell>{event.status || '-'}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleViewLocation(event)}>
                                        <MapPin className="h-4 w-4 mr-2" />
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <AttendanceMapModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                event={selectedEvent}
                workplaceConfig={workplaceConfig}
            />
        </>
    );
}
