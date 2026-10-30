import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdminReports() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    client.get('/events')
      .then(({ data }) => { if (active) setEvents(data.events || []); })
      .catch((err) => { if (active) setError(err.response?.data?.error || 'Could not load events.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!eventId) { setRows([]); return undefined; }
    let active = true;
    setError('');
    client.get(`/reports/attendance/${eventId}`)
      .then(({ data }) => { if (active) setRows(Array.isArray(data) ? data : []); })
      .catch((err) => {
        if (active) {
          setError(err.response?.status === 403
            ? 'Attendance reports are restricted to admin accounts.'
            : err.response?.data?.error || 'Could not load attendance.');
          setRows([]);
        }
      });
    return () => { active = false; };
  }, [eventId]);

  async function exportCsv() {
    try {
      setError('');
      const { data } = await client.get(`/reports/attendance/${eventId}?format=csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `attendance-${eventId}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Attendance reports are restricted to admin accounts.'
        : err.response?.data?.error || 'Could not export CSV.');
    }
  }

  return (
    <main className="page">
      <h1>Attendance reports</h1>
      <label className="select-label">Event
        <select value={eventId} onChange={(event) => setEventId(event.target.value)}>
          <option value="">Select an event</option>
          {events.map((event) => <option key={event._id} value={event._id}>{event.title}</option>)}
        </select>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {eventId && <section className="panel">
        <div className="section-title"><h2>Attendance</h2><button onClick={exportCsv}>Export CSV</button></div>
        <div className="table-scroll"><table>
          <thead><tr><th>User ID</th><th>Status</th></tr></thead>
          <tbody>{rows.map((row, i) => <tr key={`${row.user_id}-${i}`}><td>{row.user_id}</td><td>{row.status}</td></tr>)}</tbody>
        </table></div>
      </section>}
    </main>
  );
}
