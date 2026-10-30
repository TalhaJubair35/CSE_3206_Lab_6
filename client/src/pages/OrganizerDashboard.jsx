import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', venue: '', capacity: '100', startAt: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  useEffect(() => {
    let active = true;
    client.get('/events')
      .then(({ data }) => { if (active) setEvents(data.events || []); })
      .catch((err) => { if (active) setError(err.response?.data?.error || 'Could not load events.'); });
    return () => { active = false; };
  }, []);

  async function createEvent(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = {
        title: form.title,
        venue: form.venue,
        capacity: Number(form.capacity),
        ...(form.startAt ? { startAt: new Date(form.startAt).toISOString() } : {})
      };
      const { data } = await client.post('/events', payload);
      setEvents((current) => [...current, data.event]);
      setForm({ title: '', venue: '', capacity: '100', startAt: '' });
      setMessage('Event created.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create event.');
    }
  }

  return (
    <main className="page">
      <h1>Organizer dashboard</h1>
      <section className="panel">
        <h2>Create event</h2>
        <form className="form grid" onSubmit={createEvent}>
          <label>Title<input value={form.title} onChange={update('title')} required /></label>
          <label>Venue<input value={form.venue} onChange={update('venue')} /></label>
          <label>Capacity<input type="number" min="1" value={form.capacity} onChange={update('capacity')} required /></label>
          <label>Start time<input type="datetime-local" value={form.startAt} onChange={update('startAt')} /></label>
          <button>Create event</button>
        </form>
        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
      <section className="panel">
        <h2>Events</h2>
        <div className="table-scroll"><table>
          <thead><tr><th>Title</th><th>Venue</th><th>Start</th><th>Capacity</th></tr></thead>
          <tbody>{events.map((event) => <tr key={event._id}><td>{event.title}</td><td>{event.venue || '—'}</td><td>{event.startAt ? new Date(event.startAt).toLocaleString() : '—'}</td><td>{event.capacity}</td></tr>)}</tbody>
        </table></div>
      </section>
    </main>
  );
}
