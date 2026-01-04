'use client';

import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AttendanceEvent, WorkplaceConfig } from '@/lib/actions';

// Fix for default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AttendanceMapInnerProps {
    event: AttendanceEvent;
    workplaceConfig: WorkplaceConfig;
}

export default function AttendanceMapInner({ event, workplaceConfig }: AttendanceMapInnerProps) {
    if (
        !workplaceConfig ||
        !event ||
        typeof workplaceConfig.latitude !== 'number' || 
        typeof workplaceConfig.longitude !== 'number' ||
        typeof event.latitude !== 'number' ||
        typeof event.longitude !== 'number'
    ) {
         return <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg text-muted-foreground">Invalid location data</div>;
    }

    const officePos: [number, number] = [workplaceConfig.latitude, workplaceConfig.longitude];
    const eventPos: [number, number] = [event.latitude, event.longitude];
    
    const isInside = L.latLng(eventPos).distanceTo(L.latLng(officePos)) <= workplaceConfig.radius;

    return (
        <MapContainer
            center={officePos}
            zoom={15}
            style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Office Zone */}
            <Circle
                center={officePos}
                radius={workplaceConfig.radius}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
            />
            <Marker position={officePos}>
                <Popup>Office</Popup>
            </Marker>

            {/* Event Location */}
            <Marker position={eventPos}>
                <Popup>
                    {event.type === 'check_in' ? 'Check In' : 'Check Out'} <br />
                    Status: {isInside ? 'Inside Zone' : 'Outside Zone'}
                </Popup>
            </Marker>

            {/* Line connecting them */}
            <Polyline positions={[officePos, eventPos]} color={isInside ? 'green' : 'red'} dashArray={isInside ? undefined : '5, 10'} />
        </MapContainer>
    );
}
