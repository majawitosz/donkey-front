/** @format */

import { CalendarDashboard } from '@/components/calendar/calendar-dashboard';
import { fetchCalendarOverview } from '@/lib/actions';
import type { CalendarOverview } from '@/lib/actions';

export default async function CalendarsPage() {
  let error: string | undefined;
  let overview: CalendarOverview = { events: [], integrations: [] };

  try {
    overview = await fetchCalendarOverview();
  } catch (err) {
    console.error('Failed to load calendar overview', err);
    error =
      err instanceof Error
        ? err.message
        : 'Nie udało się pobrać danych kalendarza.';
  }

  return (
    <div className='container mx-auto py-6'>
      <CalendarDashboard
        events={overview.events}
        integrations={overview.integrations}
        error={error}
      />
    </div>
  );
}
