'use client';

import dynamic from 'next/dynamic';
import { WorkplaceConfig } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';

const WorkZoneMapInner = dynamic(() => import('./work-zone-map-inner'), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
});

export default function WorkZoneMap({ config }: { config: WorkplaceConfig }) {
    return <WorkZoneMapInner config={config} />;
}
