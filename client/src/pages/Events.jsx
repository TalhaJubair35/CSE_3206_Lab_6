import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    client.get('/events')
      .then(({ data }) => { if (active) setEvents(data.events || []); })
      .catch((err) => { if (active) setError(err.response?.data?.error || 'Could not load events.'); });
    return () => { active = false; };
  }, []);

  async function join(eventId) {
    setError('');
    setToast('');
    try {
      const { data } = await client.post(`/registrations/${eventId}`);
      setToast(data.registration?.status === 'waitlisted' ? 'Waitlisted' : 'Registration confirmed');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join this event.');
    }
  }

  return (
    <main className="page">
      <h1>Campus events</h1>
      {toast && <p className="success" role="status">{toast}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!events.length && !error && <p>No events are available yet.</p>}
      <section className="grid">
        {events.filter((event) => !event.cancelled).map((event) => (
          <article className="panel" key={event._id}>
            <h2>{event.title}</h2>
            <p>{event.venue || 'Venue to be announced'}</p>
            {event.startAt && <p>{new Date(event.startAt).toLocaleString()}</p>}
            <p>Capacity: {event.capacity}</p>
            <button onClick={() => join(event._id)}>Join</button>
          </article>
        ))}
      </section>
    </main>
  );
}
