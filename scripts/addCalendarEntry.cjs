#!/usr/bin/env node
/*
  Append a calendar entry to static/calendar.json based on an Issue Form body.
  Expects env:
    ISSUE_BODY - full issue markdown body
    ISSUE_USER - issue author login (optional)
*/
const fs = require('fs');
const path = require('path');

function parseIssueBody(body) {
  // Simple parser for GitHub Issue Forms: sections rendered as
  // "### <Label>" followed by user content lines until next heading.
  const lines = body.split(/\r?\n/);
  const fields = {};
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const m = /^###\s+(.+?)\s*$/.exec(lines[i]);
    if (m) {
      current = m[1].trim().toLowerCase();
      fields[current] = '';
      continue;
    }
    if (current) {
      // Skip template helper hints like "_No response_"
      const line = lines[i];
      if (line.trim() === '') continue;
      if (line.trim() === '_No response_') continue;
      // Collect content
      fields[current] += (fields[current] ? '\n' : '') + line;
    }
  }
  return fields;
}

function truthy(v) {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1';
}

function main() {
  const body = process.env.ISSUE_BODY || '';
  if (!body) {
    console.error('ISSUE_BODY env var is empty');
    process.exit(1);
  }
  const f = parseIssueBody(body);

  const title = f['title']?.trim();
  const start = f['start']?.trim();
  const end = f['end']?.trim();
  if (!title || !start || !end) {
    console.error('Missing required fields: title/start/end');
    process.exit(1);
  }
  const event = {
    title,
    start,
    end,
    allDay: truthy(f['all day event?']) || false,
    location: f['location']?.trim() || undefined,
    url: f['link (optional)']?.trim() || undefined,
    type: f['type']?.trim() || 'Event',
    color: f['color (hex, optional)']?.trim() || undefined,
    description: f['description']?.trim() || undefined,
    createdBy: process.env.ISSUE_USER || undefined,
  };

  // Basic validation of ISO dates
  if (isNaN(Date.parse(event.start)) || isNaN(Date.parse(event.end))) {
    console.error('Invalid date format. Expect ISO8601 for start/end.');
    process.exit(1);
  }

  const file = path.join(process.cwd(), 'static', 'calendar.json');
  let arr = [];
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8') || '[]';
    try { arr = JSON.parse(raw); } catch { arr = []; }
  }
  arr.push(event);
  // Sort by start date ascending
  arr.sort((a, b) => new Date(a.start) - new Date(b.start));
  fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
  console.log('Appended calendar event:', event.title);
}

main();

