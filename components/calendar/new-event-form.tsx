/** @format */
'use client';

import * as React from 'react';
import { createCalendarEvent, createMedicalEvent } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { components } from '@/lib/types/openapi';

type UserDetail = components['schemas']['UserList'];

interface NewEventFormProps {
  employees: UserDetail[];
}

export function NewEventForm({ employees }: NewEventFormProps) {
  const [eventType, setEventType] = React.useState<'regular' | 'medical'>('regular');
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>('');

  const handleSubmit = async (formData: FormData) => {
    // Add the selected employee to the form data (only if a real employee is selected)
    if (selectedEmployee && selectedEmployee !== '__none__') {
      formData.set('employee_id', selectedEmployee);
    }

    if (eventType === 'medical') {
      await createMedicalEvent(formData);
    } else {
      await createCalendarEvent(formData);
    }
  };

  return (
    <form action={handleSubmit} className='space-y-6'>
      {/* Event Type Selector */}
      <div className='space-y-2'>
        <Label>Typ wydarzenia</Label>
        <Select value={eventType} onValueChange={(value) => setEventType(value as typeof eventType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='regular'>Wydarzenie kalendarzowe</SelectItem>
            <SelectItem value='medical'>Badanie medyczne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employee Selector */}
      <div className='space-y-2'>
        <Label>Pracownik</Label>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger>
            <SelectValue placeholder='Wybierz pracownika...' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__none__'>Brak (dotyczy wszystkich)</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={String(employee.id)}>
                {employee.first_name} {employee.last_name} ({employee.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className='space-y-2'>
        <Label htmlFor='title'>
          Tytuł <span className='text-destructive'>*</span>
        </Label>
        <Input id='title' name='title' required placeholder='np. Badanie okresowe' />
      </div>

      {/* Description / Notes */}
      <div className='space-y-2'>
        <Label htmlFor='description'>{eventType === 'medical' ? 'Opis' : 'Opis'}</Label>
        <Textarea
          id='description'
          name='description'
          placeholder='Dodatkowe informacje...'
          rows={3}
        />
      </div>

      {/* Start Date/Time */}
      <div className='space-y-2'>
        <Label htmlFor='start_at'>
          Data i godzina rozpoczęcia <span className='text-destructive'>*</span>
        </Label>
        <Input id='start_at' name='start_at' type='datetime-local' required />
      </div>

      {/* End Date/Time */}
      <div className='space-y-2'>
        <Label htmlFor='end_at'>Data i godzina zakończenia</Label>
        <Input id='end_at' name='end_at' type='datetime-local' />
      </div>

      {/* Location */}
      <div className='space-y-2'>
        <Label htmlFor='location'>Lokalizacja</Label>
        <Input id='location' name='location' placeholder='np. Przychodnia Medyczna' />
      </div>

      {/* Regular Event Fields */}
      {eventType === 'regular' && (
        <>
          <div className='space-y-2'>
            <Label htmlFor='category'>Kategoria</Label>
            <Select name='category'>
              <SelectTrigger>
                <SelectValue placeholder='Wybierz kategorię...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='schedule'>Grafik</SelectItem>
                <SelectItem value='leave'>Urlop</SelectItem>
                <SelectItem value='training'>Szkolenie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='color'>Kolor (opcjonalnie)</Label>
            <Input id='color' name='color' type='color' />
          </div>
        </>
      )}

      {/* Medical Event Fields */}
      {eventType === 'medical' && (
        <>
          <div className='space-y-2'>
            <Label htmlFor='exam_type'>Rodzaj badania</Label>
            <Input
              id='exam_type'
              name='exam_type'
              placeholder='np. Badanie okresowe, Kontrola wzroku'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='status'>Status</Label>
            <Select name='status'>
              <SelectTrigger>
                <SelectValue placeholder='Wybierz status...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='planned'>Zaplanowane</SelectItem>
                <SelectItem value='confirmed'>Potwierdzone</SelectItem>
                <SelectItem value='completed'>Zrealizowane</SelectItem>
                <SelectItem value='cancelled'>Anulowane</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notatki</Label>
            <Textarea id='notes' name='notes' placeholder='Dodatkowe uwagi...' rows={3} />
          </div>
        </>
      )}

      {/* Submit Button */}
      <div className='flex gap-3 pt-4'>
        <Button type='submit' className='flex-1'>
          Utwórz wydarzenie
        </Button>
        <Button type='button' variant='outline' onClick={() => window.history.back()}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
