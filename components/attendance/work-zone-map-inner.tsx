'use client';

import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { WorkplaceConfig } from '@/lib/actions';

// Fix for default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WorkZoneMapProps {
    config: WorkplaceConfig;
}

export default function WorkZoneMapInner({ config }: WorkZoneMapProps) {
    if (!config || typeof config.latitude !== 'number' || typeof config.longitude !== 'number') {
        return <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg text-muted-foreground">Invalid location data</div>;
    }

    return (
        <MapContainer
            center={[config.latitude, config.longitude]}
            zoom={15}
            style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle
                center={[config.latitude, config.longitude]}
                radius={config.radius}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
            />
            <Marker position={[config.latitude, config.longitude]}>
                <Popup>
                    Workplace Location <br /> Radius: {config.radius}m
                </Popup>
            </Marker>
        </MapContainer>
    );
}
