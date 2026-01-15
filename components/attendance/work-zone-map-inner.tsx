/** @format */

'use client';

import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { WorkplaceConfig } from '@/lib/actions';
import { useTranslations } from 'next-intl';

// Fix for default marker icon
// @ts-expect-error -- Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
	iconUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
	shadowUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WorkZoneMapProps {
	config: WorkplaceConfig;
}

export default function WorkZoneMapInner({ config }: WorkZoneMapProps) {
	const t = useTranslations('Attendance');

	const lat = Number(config?.latitude);
	const lng = Number(config?.longitude);
	const radius = Number(config?.radius);

	if (!config || isNaN(lat) || isNaN(lng)) {
		return (
			<div className='h-[300px] flex items-center justify-center bg-muted rounded-lg text-muted-foreground'>
				{t('invalidLocationData')}
			</div>
		);
	}

	return (
		<MapContainer
			center={[lat, lng]}
			zoom={15}
			style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }}>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
			/>
			<Circle
				center={[lat, lng]}
				radius={radius}
				pathOptions={{
					color: 'blue',
					fillColor: 'blue',
					fillOpacity: 0.2,
				}}
			/>
			<Marker position={[lat, lng]}>
				<Popup>
					{t('workplaceLocation')} <br /> {t('radius')}: {radius}m
				</Popup>
			</Marker>
		</MapContainer>
	);
}
