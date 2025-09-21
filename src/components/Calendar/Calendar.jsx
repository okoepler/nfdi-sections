import React, {useMemo, useEffect, useState, useCallback} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {Calendar as RBCalendar, Views, dateFnsLocalizer} from 'react-big-calendar';
import {format, parse, startOfWeek, getDay} from 'date-fns';
import {enUS} from 'date-fns/locale';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({format, parse, startOfWeek, getDay, locales});

function useCalendarData() {
  const url = useBaseUrl('/calendar.json');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(url, {cache: 'no-cache'});
        if (!res.ok) throw new Error(`Failed to load calendar: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const mapped = (data || []).map(ev => ({
          title: ev.title,
          start: new Date(ev.start),
          end: new Date(ev.end),
          allDay: !!ev.allDay,
          url: ev.url,
          location: ev.location,
          description: ev.description,
          type: ev.type,
          color: ev.color,
        }));
        setEvents(mapped);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true };
  }, [url]);

  return {events, loading, error};
}

function Legend({events}) {
  const items = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const key = (ev.type || ev.title || 'Event') + '|' + (ev.color || 'var(--ifm-color-primary)');
      if (!map.has(key)) map.set(key, {label: ev.type || 'Event', color: ev.color || 'var(--ifm-color-primary)'});
    }
    return Array.from(map.values());
  }, [events]);

  if (!items.length) return null;
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem'}}>
      {items.map((it, i) => (
        <span key={i} style={{display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.9rem'}}>
          <span style={{width:12, height:12, background:it.color, border:'1px solid var(--ifm-color-emphasis-300)'}} />
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

export default function Calendar() {
  const {events, loading, error} = useCalendarData();

  const eventPropGetter = useCallback((event) => {
    const style = {
      backgroundColor: event.color || 'var(--ifm-color-primary)',
      borderRadius: '4px',
      border: '1px solid var(--ifm-color-emphasis-300)',
      color: '#ffffff',
      opacity: 0.95,
    };
    return {style};
  }, []);

  const onSelectEvent = useCallback((event) => {
    if (event.url) window.open(event.url, '_blank', 'noopener');
  }, []);

  if (error) {
    return <div className="alert alert--danger">{String(error)}</div>;
  }

  return (
    <div>
      {loading && <div className="alert alert--info">Loading calendar…</div>}
      <Legend events={events} />
      <div className="calendarWrapper">
        <RBCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.MONTH}
          style={{height: '70vh'}}
          popup
          eventPropGetter={eventPropGetter}
          onSelectEvent={onSelectEvent}
        />
      </div>
      <p style={{marginTop:'0.5rem', fontSize:'0.9rem'}}>
        Times are displayed in your browser timezone.
      </p>
    </div>
  );
}
