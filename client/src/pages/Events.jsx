import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;

    client.get('/events')
      .then(({ data }) => {
        if (active) {
          setEvents(data.events || []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.error || 'Unable to load events.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function joinEvent(eventId) {
    setError('');
    setToast('');
    try {
      const { data } = await client.post(`/registrations/${eventId}`);
      setToast(data.registration?.status === 'waitlisted'
        ? 'Waitlisted'
        : 'Registration confirmed');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to join this event.');
    }
  }

  return (
    <main className="page">
      <h1>Campus events</h1>
      {toast && <div className="toast" role="status">{toast}</div>}
      {error && <p className="error" role="alert">{error}</p>}
      {events.length === 0 && !error && <p>No events are available yet.</p>}
      <section className="event-grid" aria-label="Events">
        {events.filter((event) => !event.cancelled).map((event) => (
          <article className="card" key={event._id}>
            <h2>{event.title}</h2>
            <p>{event.venue || 'Venue to be announced'}</p>
            {event.startAt && <p>{new Date(event.startAt).toLocaleString()}</p>}
            <p>Capacity: {event.capacity}</p>
            <button type="button" onClick={() => joinEvent(event._id)}>Join</button>
          </article>
        ))}
      </section>
    </main>
  );
}
