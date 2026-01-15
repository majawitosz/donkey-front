/** @format */

'use client';

import {
	MapContainer,
	TileLayer,
	Circle,
	Marker,
	Popup,
	Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AttendanceEvent, WorkplaceConfig } from '@/lib/actions';
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

interface AttendanceMapInnerProps {
	event: AttendanceEvent;
	workplaceConfig: WorkplaceConfig;
}

export default function AttendanceMapInner({
	event,
	workplaceConfig,
}: AttendanceMapInnerProps) {
	const t = useTranslations('Attendance');

	const officeLat = Number(workplaceConfig?.latitude);
	const officeLng = Number(workplaceConfig?.longitude);
	const eventLat = Number(event?.latitude);
	const eventLng = Number(event?.longitude);
	const radius = Number(workplaceConfig?.radius);

	if (
		!workplaceConfig ||
		!event ||
		isNaN(officeLat) ||
		isNaN(officeLng) ||
		isNaN(eventLat) ||
		isNaN(eventLng)
	) {
		return (
			<div className='h-[400px] flex items-center justify-center bg-muted rounded-lg text-muted-foreground'>
				{t('invalidLocationData')}
			</div>
		);
	}

	const officePos: [number, number] = [officeLat, officeLng];
	const eventPos: [number, number] = [eventLat, eventLng];

	const isInside =
		L.latLng(eventPos).distanceTo(L.latLng(officePos)) <= radius;

	return (
		<MapContainer
			center={officePos}
			zoom={15}
			style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
			/>

			{/* Office Zone */}
			<Circle
				center={officePos}
				radius={radius}
				pathOptions={{
					color: 'blue',
					fillColor: 'blue',
					fillOpacity: 0.1,
				}}
			/>
			<Marker position={officePos}>
				<Popup>{t('workplaceLocation')}</Popup>
			</Marker>

			{/* Event Location */}
			<Marker position={eventPos}>
				<Popup>
					{event.type === 'check_in' ? t('checkIn') : t('checkOut')}{' '}
					<br />
					{t('distance')}:{' '}
					{Math.round(
						L.latLng(eventPos).distanceTo(L.latLng(officePos))
					)}
					m <br />
					Status: {isInside ? t('insideZone') : t('outsideZone')}
				</Popup>
			</Marker>

			{/* Line connecting them */}
			<Polyline
				positions={[officePos, eventPos]}
				color={isInside ? 'green' : 'red'}
				dashArray={isInside ? undefined : '5, 10'}
			/>
		</MapContainer>
	);
}
