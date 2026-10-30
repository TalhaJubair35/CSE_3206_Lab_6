import { useEffect, useState } from 'react';
import client, { getTokenClaims } from '../api/client';

export default function OrganizerDashboard() {
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [startAt, setStartAt] = useState('');
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const organizerId = getTokenClaims()?.id;

  useEffect(() => {
    let active = true;

    client.get('/events')
      .then(({ data }) => {
        if (active) {
          setEvents((data.events || []).filter((event) => {
            const eventOrganizerId = event.organizerId?._id || event.organizerId;
            return String(eventOrganizerId) === String(organizerId);
          }));
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.error || 'Unable to load your events.');
        }
      });

    return () => {
      active = false;
    };
  }, [organizerId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await client.post('/events', {
        title,
        venue,
        capacity: Number(capacity),
        ...(startAt ? { startAt: new Date(startAt).toISOString() } : {})
      });
      setEvents((current) => [...current, data.event]);
      setTitle('');
      setVenue('');
      setCapacity('100');
      setStartAt('');
      setMessage('Event created.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create event.');
    }
  }

  return (
    <main className="page">
      <h1>Organizer dashboard</h1>
      <section className="panel">
        <h2>Create event</h2>
        <form className="form form-grid" onSubmit={handleSubmit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Venue
            <input value={venue} onChange={(event) => setVenue(event.target.value)} />
          </label>
          <label>
            Capacity
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              required
            />
          </label>
          <label>
            Start time
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </label>
          <button type="submit">Create event</button>
        </form>
        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <section className="panel">
        <h2>Your events</h2>
        {events.length === 0
          ? <p>You have not created any events yet.</p>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Venue</th><th>Start</th><th>Capacity</th></tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td>{event.title}</td>
                      <td>{event.venue || '—'}</td>
                      <td>{event.startAt ? new Date(event.startAt).toLocaleString() : '—'}</td>
                      <td>{event.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </main>
  );
}
