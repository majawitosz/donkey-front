/** @format */

import { fetchEmployees } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { NewEventForm } from '@/components/calendar/new-event-form';

export default async function NewCalendarEventPage() {
  const employees = await fetchEmployees();

  return (
    <div className='container mx-auto py-6'>
      <Card>
        <CardHeader>
          <CardTitle>Dodaj wydarzenie</CardTitle>
          <CardDescription>
            Utwórz nowe wydarzenie w kalendarzu firmy lub zaplanuj badanie medyczne.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewEventForm employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
