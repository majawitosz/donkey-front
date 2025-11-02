/** @format */
'use client';

import * as React from 'react';
import {
  compareAsc,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
  differenceInMinutes,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  Clock3,
  ExternalLink,
  GraduationCap,
  MapPin,
  RefreshCcw,
  Stethoscope,
  Umbrella,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarIntegration } from '@/lib/actions';

const CATEGORY_CONFIG = {
  schedule: {
    label: 'Grafiki',
    description: 'Podgląd zmian i dyżurów wygenerowanych w grafiku pracy.',
    emptyTitle: 'Brak zmian w wybranym dniu',
    emptyHint: 'Wygeneruj grafik lub wybierz inną datę, aby zobaczyć zaplanowane zmiany.',
    badgeVariant: 'default' as const,
    icon: CalendarClock,
    highlightClass:
      'after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary/80',
  },
  vacation: {
    label: 'Urlopy',
    description: 'Zaplanowane urlopy i nieobecności pracowników.',
    emptyTitle: 'Brak urlopów w tej dacie',
    emptyHint: 'Gdy tylko urlop zostanie zaakceptowany pojawi się w tym kalendarzu.',
    badgeVariant: 'secondary' as const,
    icon: Umbrella,
    highlightClass:
      'after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-amber-500/80',
  },
  training: {
    label: 'Szkolenia',
    description: 'Szkolenia i wydarzenia rozwojowe zaplanowane dla zespołu.',
    emptyTitle: 'Brak szkoleń w wybranym dniu',
    emptyHint: 'Dodaj szkolenie lub wybierz inny termin, aby zobaczyć plan działań rozwojowych.',
    badgeVariant: 'outline' as const,
    icon: GraduationCap,
    highlightClass:
      'after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-sky-500/80',
  },
  medical: {
    label: 'Badania',
    description: 'Badania okresowe i kontrole medyczne wymagane przez BHP.',
    emptyTitle: 'Brak badań w wybranej dacie',
    emptyHint: 'Zaplanowane badania pracowników będą widoczne w tej zakładce.',
    badgeVariant: 'muted' as const,
    icon: Stethoscope,
    highlightClass:
      'after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500/80',
  },
};

const VIEW_OPTIONS = [
  { value: 'month', label: 'Widok miesięczny' },
  { value: 'agenda', label: 'Agenda' },
] as const;

type CalendarCategory = keyof typeof CATEGORY_CONFIG;

type BadgeVariant = (typeof CATEGORY_CONFIG)[CalendarCategory]['badgeVariant'];

interface EnrichedCalendarEvent extends CalendarEvent {
  category: CalendarCategory;
  startDate: Date | null;
  endDate: Date | null;
  allDay: boolean;
  durationMinutes: number | null;
}

interface CalendarDashboardProps {
  events: CalendarEvent[];
  integrations: CalendarIntegration[];
  error?: string;
}

export function CalendarDashboard({ events, integrations, error }: CalendarDashboardProps) {
  const eventsWithMeta = React.useMemo<EnrichedCalendarEvent[]>(
    () =>
      events.map((event) => {
        const category = detectCategory(event);
        const startDate = parseEventDate(event.start);
        const endDateRaw = parseEventDate(event.end ?? undefined);
        const endDate = normalizeEndDate(startDate, endDateRaw);
        const allDayFlag = Boolean(
          event.all_day ?? event.allDay ?? isAllDayEvent(startDate, endDate)
        );
        const durationMinutes =
          startDate && endDate ? differenceInMinutes(endDate, startDate) : null;

        return {
          ...event,
          category,
          startDate,
          endDate,
          allDay: allDayFlag,
          durationMinutes,
        };
      }),
    [events]
  );

  const eventsByCategory = React.useMemo(() => {
    return {
      schedule: eventsWithMeta.filter((event) => event.category === 'schedule'),
      vacation: eventsWithMeta.filter((event) => event.category === 'vacation'),
      training: eventsWithMeta.filter((event) => event.category === 'training'),
      medical: eventsWithMeta.filter((event) => event.category === 'medical'),
    } satisfies Record<CalendarCategory, EnrichedCalendarEvent[]>;
  }, [eventsWithMeta]);

  const tabConfig = React.useMemo(
    () =>
      (Object.keys(CATEGORY_CONFIG) as CalendarCategory[]).map((key) => ({
        value: key,
        ...CATEGORY_CONFIG[key],
        events: eventsByCategory[key],
      })),
    [eventsByCategory]
  );

  const [activeTab, setActiveTab] = React.useState<CalendarCategory>('schedule');

  React.useEffect(() => {
    if (!eventsByCategory[activeTab]?.length) {
      const firstWithEvents = tabConfig.find((tab) => tab.events.length > 0);
      if (firstWithEvents) {
        setActiveTab(firstWithEvents.value);
      }
    }
  }, [activeTab, eventsByCategory, tabConfig]);

  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold tracking-tight'>Kalendarze i widoki czasowe</h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            Centralne miejsce do przeglądu grafików, urlopów, szkoleń oraz obowiązkowych
            badań pracowników. Użyj zakładek, aby szybko przełączać się między
            najważniejszymi obszarami planowania czasu.
          </p>
        </div>
        {error ? (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Nie udało się pobrać danych kalendarza</AlertTitle>
            <AlertDescription>
              {error}. Upewnij się, że masz aktywną sesję (wymagana autoryzacja) i spróbuj
              odświeżyć stronę.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CalendarCategory)}>
        <TabsList className='flex flex-wrap gap-2 bg-transparent p-0'>
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm data-[state=active]:border-primary data-[state=active]:shadow-md'>
              <tab.icon className='h-4 w-4' />
              <span>{tab.label}</span>
              <Badge variant='outline' className='ml-1 hidden sm:inline-flex'>
                {tab.events.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className='space-y-6'>
            <CalendarTabContent
              category={tab.value}
              description={tab.description}
              events={tab.events}
            />
          </TabsContent>
        ))}
      </Tabs>

      <IntegrationManager integrations={integrations} />
    </div>
  );
}

interface CalendarTabContentProps {
  category: CalendarCategory;
  description: string;
  events: EnrichedCalendarEvent[];
}

function CalendarTabContent({ category, description, events }: CalendarTabContentProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(startOfDay(new Date()));
  const [viewMode, setViewMode] = React.useState<(typeof VIEW_OPTIONS)[number]['value']>('month');

  const eventDays = React.useMemo(() => collectEventDays(events), [events]);
  const eventsByDay = React.useMemo(() => groupEventsByDay(events), [events]);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = eventsByDay.get(selectedKey) ?? [];
  const upcomingEvents = React.useMemo(() => getUpcomingEvents(events), [events]);

  const config = CATEGORY_CONFIG[category];

  return (
    <Card>
      <CardHeader className='space-y-2'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <config.icon className='h-5 w-5 text-muted-foreground' />
              {config.label}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
            <SelectTrigger size='sm' className='min-w-[160px] justify-between'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align='end'>
              {VIEW_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className='grid gap-6 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr]'>
        <div className='space-y-4'>
          <div className='rounded-lg border'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(startOfDay(date))}
              defaultMonth={selectedDate}
              locale={pl}
              className='w-full'
              modifiers={{ wydarzenie: eventDays }}
              modifiersClassNames={{
                wydarzenie: cn(
                  'relative font-semibold text-foreground',
                  config.highlightClass
                ),
              }}
            />
          </div>
          <div className='rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2'>
            <div className='flex items-center gap-2 font-medium text-foreground'>
              <CalendarRange className='h-4 w-4' />
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: pl })}
            </div>
            <p>
              {selectedEvents.length > 0
                ? `Na ten dzień zaplanowano ${selectedEvents.length} ${pluralize(selectedEvents.length, 'wydarzenie', 'wydarzenia', 'wydarzeń')}.`
                : config.emptyHint}
            </p>
          </div>
        </div>
        <div>
          {viewMode === 'agenda' ? (
            <AgendaView
              events={upcomingEvents}
              category={category}
              emptyTitle={config.emptyTitle}
              emptyHint={config.emptyHint}
            />
          ) : (
            <DayEventsView
              events={selectedEvents}
              category={category}
              emptyTitle={config.emptyTitle}
              emptyHint={config.emptyHint}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface EventsViewProps {
  events: EnrichedCalendarEvent[];
  category: CalendarCategory;
  emptyTitle: string;
  emptyHint: string;
}

function DayEventsView({ events, category, emptyTitle, emptyHint }: EventsViewProps) {
  if (events.length === 0) {
    return <EventsEmptyState title={emptyTitle} description={emptyHint} />;
  }

  return (
    <ScrollArea className='h-[420px] rounded-lg border'>
      <div className='space-y-4 p-4'>
        {events.map((event) => (
          <EventCard key={`${event.id}-${event.start}`} event={event} category={category} />
        ))}
      </div>
    </ScrollArea>
  );
}

function AgendaView({ events, category, emptyTitle, emptyHint }: EventsViewProps) {
  if (events.length === 0) {
    return <EventsEmptyState title={emptyTitle} description={emptyHint} />;
  }

  return (
    <ScrollArea className='h-[420px] rounded-lg border'>
      <div className='space-y-4 p-4'>
        {events.map((event) => (
          <div key={`${event.id}-${event.start}`} className='space-y-2'>
            <div className='flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground'>
              <span>{formatEventDayLabel(event)}</span>
              <span>{formatEventTime(event)}</span>
            </div>
            <EventCard event={event} category={category} compact />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function EventsEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className='flex h-[420px] flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground'>
      <CalendarRange className='mb-3 h-10 w-10 text-muted-foreground/60' />
      <p className='font-medium text-foreground'>{title}</p>
      <p className='mt-1 max-w-sm text-pretty'>{description}</p>
    </div>
  );
}

function EventCard({
  event,
  category,
  compact = false,
}: {
  event: EnrichedCalendarEvent;
  category: CalendarCategory;
  compact?: boolean;
}) {
  const config = CATEGORY_CONFIG[category];
  const badgeVariant: BadgeVariant = config.badgeVariant;

  return (
    <div className='rounded-lg border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Badge variant={badgeVariant}>{config.label}</Badge>
          {event.external_calendar || event.externalCalendar ? (
            <Badge variant='outline' className='flex items-center gap-1'>
              <ExternalLink className='h-3.5 w-3.5' />
              {event.external_calendar || event.externalCalendar}
            </Badge>
          ) : null}
        </div>
        <span className='text-xs font-medium text-muted-foreground'>
          {formatEventTime(event)}
        </span>
      </div>
      <div className='mt-3 space-y-2'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold text-foreground'>{event.title}</p>
            {event.description ? (
              <p className='mt-1 text-sm text-muted-foreground line-clamp-3'>{event.description}</p>
            ) : null}
            {category === 'medical' && (event.exam_type || event.status) ? (
              <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                {event.exam_type ? <Badge variant='outline'>{event.exam_type}</Badge> : null}
                {event.status ? (
                  <Badge variant='secondary'>{formatMedicalStatus(event.status)}</Badge>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {event.location ? (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <MapPin className='h-4 w-4' />
            <span>{event.location}</span>
          </div>
        ) : null}
        {!compact ? <Separator className='my-2' /> : null}
        {!compact && event.startDate ? (
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Clock3 className='h-4 w-4' />
            <span>
              {event.allDay
                ? 'Cały dzień'
                : event.durationMinutes && event.durationMinutes > 0
                ? `${Math.max(Math.round(event.durationMinutes / 60), 1)} h`
                : 'Godziny do potwierdzenia'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IntegrationManager({ integrations }: { integrations: CalendarIntegration[] }) {
  const [autoSync, setAutoSync] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setAutoSync(() => {
      const nextState: Record<string, boolean> = {};
      integrations.forEach((integration) => {
        nextState[integration.id] = Boolean(integration.connected);
      });
      return nextState;
    });
  }, [integrations]);

  if (integrations.length === 0) {
    return (
      <Card className='border-dashed'>
        <CardHeader>
          <CardTitle>Synchronizacja z kalendarzami zewnętrznymi</CardTitle>
          <CardDescription>
            Podłącz kalendarz Google lub Outlook, aby automatycznie udostępniać grafiki i
            urlopy całemu zespołowi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant='outline'>Dodaj nowe połączenie</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synchronizacja z kalendarzami zewnętrznymi</CardTitle>
        <CardDescription>
          Zarządzaj połączeniami i decyduj, które kalendarze mają otrzymywać aktualizacje w
          czasie rzeczywistym.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {integrations.map((integration) => {
          const connected = Boolean(integration.connected);
          const statusLabel = connected ? 'Połączono' : 'Rozłączono';
          const statusVariant = connected ? 'default' : 'outline';
          const lastSyncValue = integration.last_sync_at ?? integration.last_synced_at ?? null;
          const lastSyncLabel = lastSyncValue ? formatDateTime(lastSyncValue) : 'Brak danych';
          const providerBadge = formatIntegrationProvider(integration.provider_code);
          const externalBadge = integration.primary_calendar;
          const connectionLabel = integration.name ?? integration.provider;

          return (
            <div
              key={integration.id}
              className='flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='text-sm font-semibold text-foreground'>{connectionLabel}</p>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                  {providerBadge ? <Badge variant='outline'>{providerBadge}</Badge> : null}
                  {externalBadge ? (
                    <Badge variant='outline' className='text-xs font-medium'>
                      {externalBadge}
                    </Badge>
                  ) : null}
                </div>
                <p className='text-sm text-muted-foreground'>
                  Ostatnia synchronizacja: {lastSyncLabel}
                </p>
                {integration.sync_error ? (
                  <p className='text-xs text-destructive'>Błąd synchronizacji: {integration.sync_error}</p>
                ) : null}
              </div>
              <div className='flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center'>
                <div className='flex items-center gap-2 rounded-md border px-3 py-2'>
                  <Switch
                    checked={autoSync[integration.id]}
                    onCheckedChange={(checked) =>
                      setAutoSync((prev) => ({ ...prev, [integration.id]: checked }))
                    }
                  />
                  <Label className='text-sm'>Automatyczna synchronizacja</Label>
                </div>
                <Button variant='outline' size='sm' className='w-full md:w-auto'>
                  <RefreshCcw className='mr-2 h-4 w-4' /> Synchronizuj teraz
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function detectCategory(event: CalendarEvent): CalendarCategory {
  const directCategory =
    typeof event.category === 'string' ? event.category.toLowerCase() : undefined;
  if (isCalendarCategory(directCategory)) {
    return directCategory;
  }

  const originalCategory =
    typeof event.original_category === 'string'
      ? event.original_category.toLowerCase()
      : undefined;
  if (isCalendarCategory(originalCategory)) {
    return originalCategory;
  }
  if (originalCategory === 'leave') {
    return 'vacation';
  }

  const typeValue = String(event.type ?? '').toLowerCase();
  if (isCalendarCategory(typeValue)) {
    return typeValue;
  }
  const titleValue = String(event.title ?? '').toLowerCase();

  if (typeValue.includes('vac') || typeValue.includes('leave') || titleValue.includes('urlop')) {
    return 'vacation';
  }
  if (typeValue.includes('train') || titleValue.includes('szkole') || titleValue.includes('trening')) {
    return 'training';
  }
  if (
    typeValue.includes('med') ||
    typeValue.includes('exam') ||
    typeValue.includes('badania') ||
    titleValue.includes('badanie') ||
    titleValue.includes('medyc')
  ) {
    return 'medical';
  }
  return 'schedule';
}

function isCalendarCategory(value: string | undefined): value is CalendarCategory {
  if (!value) {
    return false;
  }
  return value in CATEGORY_CONFIG;
}

function parseEventDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsedIso = parseISO(value);
  if (isValid(parsedIso)) {
    return parsedIso;
  }
  const parsedNative = new Date(value);
  return isValid(parsedNative) ? parsedNative : null;
}

function normalizeEndDate(start: Date | null, end: Date | null): Date | null {
  if (!start) {
    return end;
  }
  if (!end) {
    return start;
  }
  if (isBefore(end, start)) {
    return start;
  }
  return end;
}

function isAllDayEvent(start: Date | null, end: Date | null): boolean {
  if (!start || !end) {
    return false;
  }
  return isSameDay(start, end) && start.getHours() === 0 && end.getHours() === 0;
}

function collectEventDays(events: EnrichedCalendarEvent[]): Date[] {
  const dates = new Map<string, Date>();

  events.forEach((event) => {
    if (!event.startDate) {
      return;
    }
    const intervalStart = event.startDate;
    const intervalEnd = event.endDate ?? event.startDate;
    const safeEnd = isAfter(intervalEnd, intervalStart) ? intervalEnd : intervalStart;
    const days = eachDayOfInterval({ start: intervalStart, end: safeEnd });
    days.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      if (!dates.has(key)) {
        dates.set(key, day);
      }
    });
  });

  return Array.from(dates.values());
}

function groupEventsByDay(events: EnrichedCalendarEvent[]): Map<string, EnrichedCalendarEvent[]> {
  const map = new Map<string, EnrichedCalendarEvent[]>();

  events.forEach((event) => {
    if (!event.startDate) {
      return;
    }
    const startDayKey = format(event.startDate, 'yyyy-MM-dd');
    const entries = map.get(startDayKey) ?? [];
    entries.push(event);
    entries.sort((a, b) => compareAsc(a.startDate ?? new Date(0), b.startDate ?? new Date(0)));
    map.set(startDayKey, entries);
  });

  return map;
}

function getUpcomingEvents(events: EnrichedCalendarEvent[]): EnrichedCalendarEvent[] {
  const today = startOfDay(new Date());

  return events
    .filter((event) => {
      if (!event.startDate) {
        return false;
      }
      return !isBefore(event.startDate, today);
    })
    .sort((a, b) => compareAsc(a.startDate ?? new Date(0), b.startDate ?? new Date(0)));
}

function formatEventTime(event: EnrichedCalendarEvent): string {
  if (!event.startDate) {
    return 'Godziny do potwierdzenia';
  }
  if (event.allDay) {
    return 'Cały dzień';
  }
  if (!event.endDate || isSameDay(event.startDate, event.endDate)) {
    return `${format(event.startDate, 'HH:mm', { locale: pl })}${
      event.endDate ? ` – ${format(event.endDate, 'HH:mm', { locale: pl })}` : ''
    }`;
  }
  return `${format(event.startDate, 'd MMM HH:mm', { locale: pl })} – ${format(
    event.endDate,
    'd MMM HH:mm',
    { locale: pl }
  )}`;
}

function formatEventDayLabel(event: EnrichedCalendarEvent): string {
  if (!event.startDate) {
    return 'Do ustalenia';
  }
  const startLabel = format(event.startDate, 'EEEE, d MMMM', { locale: pl });
  if (!event.endDate || isSameDay(event.startDate, event.endDate)) {
    return startLabel;
  }
  const endLabel = format(event.endDate, 'd MMMM', { locale: pl });
  return `${startLabel} – ${endLabel}`;
}

function formatDateTime(value: string): string {
  const parsed = parseEventDate(value);
  if (!parsed) {
    return value;
  }
  return format(parsed, 'd MMMM yyyy, HH:mm', { locale: pl });
}

function formatIntegrationProvider(provider?: string | null): string | null {
  if (!provider) {
    return null;
  }
  const normalized = provider.toLowerCase();
  switch (normalized) {
    case 'google':
      return 'Google Calendar';
    case 'outlook':
      return 'Microsoft Outlook';
    case 'ics':
      return 'Plik ICS';
    case 'other':
      return 'Inny kalendarz';
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

function formatMedicalStatus(status: string): string {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'planned':
      return 'Zaplanowane';
    case 'confirmed':
      return 'Potwierdzone';
    case 'completed':
      return 'Zrealizowane';
    case 'cancelled':
      return 'Anulowane';
    default:
      return status;
  }
}

function pluralize(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  }
  return many;
}
