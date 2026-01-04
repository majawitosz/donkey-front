'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from 'next/dynamic';
import { AttendanceEvent, WorkplaceConfig } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";

const AttendanceMapInner = dynamic(() => import('./attendance-map-inner'), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

interface AttendanceMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: AttendanceEvent | null;
    workplaceConfig: WorkplaceConfig | null;
}

export default function AttendanceMapModal({ isOpen, onClose, event, workplaceConfig }: AttendanceMapModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Attendance Location</DialogTitle>
                </DialogHeader>
                {event && workplaceConfig ? (
                    <AttendanceMapInner event={event} workplaceConfig={workplaceConfig} />
                ) : (
                    <div className="h-[400px] flex items-center justify-center">
                        <p>Missing location data</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
