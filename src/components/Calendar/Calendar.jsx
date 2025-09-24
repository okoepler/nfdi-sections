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

function Legend({events, enabledTypes, onToggleType, onShowAll}) {
  const items = useMemo(() => {
    const byType = new Map();
    for (const ev of events) {
      const label = ev.type || 'Event';
      if (!byType.has(label)) byType.set(label, {label, color: ev.color || 'var(--ifm-color-primary)'});
    }
    return Array.from(byType.values());
  }, [events]);

  if (!items.length) return null;
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem', alignItems:'center'}}>
      <strong style={{marginRight:'0.25rem'}}>Filter:</strong>
      {items.map((it) => {
        const active = enabledTypes.has(it.label);
        return (
          <button
            key={it.label}
            type="button"
            onClick={() => onToggleType(it.label)}
            title={active ? 'Click to hide this type' : 'Click to show this type'}
            style={{
              display:'inline-flex', alignItems:'center', gap:'0.4rem',
              fontSize:'0.9rem', padding:'0.25rem 0.5rem', cursor:'pointer',
              borderRadius: '4px', border: '1px solid var(--ifm-color-emphasis-300)',
              background: active ? 'var(--ifm-background-surface-color)' : 'var(--ifm-background-color)',
              opacity: active ? 1 : 0.5,
            }}
          >
            <span style={{width:12, height:12, background:it.color, border:'1px solid var(--ifm-color-emphasis-300)'}} />
            <span>{it.label}</span>
          </button>
        );
      })}
      <button type="button" onClick={onShowAll} style={{marginLeft:'0.25rem'}} className="button button--sm button--secondary">
        Show all
      </button>
    </div>
  );
}

export default function Calendar() {
  const {events, loading, error} = useCalendarData();
  const [enabledTypes, setEnabledTypes] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Initialize enabled types when events change
  useEffect(() => {
    const types = new Set((events || []).map(ev => ev.type || 'Event'));
    setEnabledTypes(types);
  }, [events]);

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
    setSelectedEvent(event);
  }, []);

  const filtered = useMemo(() => {
    return events.filter(ev => enabledTypes.has(ev.type || 'Event'));
  }, [events, enabledTypes]);

  const tooltipAccessor = useCallback((event) => {
    const parts = [];
    if (event.description) parts.push(event.description);
    if (event.location) parts.push(event.location);
    return parts.join(' • ');
  }, []);

  const handleToggleType = useCallback((label) => {
    setEnabledTypes(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }, []);

  const handleShowAll = useCallback(() => {
    const types = new Set((events || []).map(ev => ev.type || 'Event'));
    setEnabledTypes(types);
  }, [events]);

  if (error) {
    return <div className="alert alert--danger">{String(error)}</div>;
  }

  return (
    <div>
      {loading && <div className="alert alert--info">Loading calendar…</div>}
      <Legend events={events} enabledTypes={enabledTypes} onToggleType={handleToggleType} onShowAll={handleShowAll} />
      <div className="calendarWrapper">
        <RBCalendar
          localizer={localizer}
          events={filtered}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.MONTH}
          style={{height: '70vh'}}
          popup
          eventPropGetter={eventPropGetter}
          onSelectEvent={onSelectEvent}
          tooltipAccessor={tooltipAccessor}
        />
      </div>
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />)
      }
      <p style={{marginTop:'0.5rem', fontSize:'0.9rem'}}>
        Times are displayed in your browser timezone.
      </p>
    </div>
  );
}

function EventModal({event, onClose}) {
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const meta = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });
    const startStr = fmt.format(event.start);
    const endStr = fmt.format(event.end);
    const tzNameFmt = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', timeZoneName: 'short' });
    const tzName = tzNameFmt.format(event.start).split(' ').pop();
    return {startStr, endStr, tzName};
  }, [event.start, event.end]);

  return (
    <div className="calendarModalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="calendarModal" onClick={e => e.stopPropagation()}>
        <div className="calendarModalHeader">
          <h3 style={{margin:0}}>{event.title}</h3>
          <button className="button button--sm button--secondary" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="calendarModalBody">
          <p><strong>Wann (Berlin):</strong> {meta.startStr} – {meta.endStr} <em>({meta.tzName})</em></p>
          {event.location && <p><strong>Where:</strong> {event.location}</p>}
          {event.type && <p><strong>Type:</strong> {event.type}</p>}
          {event.description && (
            <div>
              <strong>Description:</strong>
              <p style={{marginTop:'0.25rem'}}>{event.description}</p>
            </div>
          )}
        </div>
        <div className="calendarModalFooter">
          {event.url && (
            <a className="button button--primary" href={event.url} target="_blank" rel="noopener noreferrer">Open link</a>
          )}
          <button className="button button--secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
