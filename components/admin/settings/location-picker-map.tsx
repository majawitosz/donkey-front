'use client';

import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerMapProps {
    latitude: number;
    longitude: number;
    radius: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ position, onLocationSelect }: { position: [number, number], onLocationSelect: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        map.flyTo(position, map.getZoom());
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Selected Location</Popup>
        </Marker>
    );
}

export default function LocationPickerMap({ latitude, longitude, radius, onLocationSelect }: LocationPickerMapProps) {
    const center: [number, number] = [latitude || 52.2297, longitude || 21.0122]; // Default to Warsaw if 0/0

    return (
        <MapContainer
            center={center}
            zoom={15}
            style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle
                center={[latitude, longitude]}
                radius={radius}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
            />
            <LocationMarker position={[latitude, longitude]} onLocationSelect={onLocationSelect} />
        </MapContainer>
    );
}
