import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdminReports() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

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
    if (!eventId) {
      setRows([]);
      return undefined;
    }

    let active = true;
    setError('');
    client.get(`/reports/attendance/${eventId}`)
      .then(({ data }) => {
        if (active) {
          setRows(Array.isArray(data) ? data : []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.error || 'Unable to load attendance.');
          setRows([]);
        }
      });

    return () => {
      active = false;
    };
  }, [eventId]);

  async function exportCsv() {
    if (!eventId) {
      return;
    }

    setError('');
    try {
      const { data } = await client.get(`/reports/attendance/${eventId}`, {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${eventId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to export CSV.');
    }
  }

  return (
    <main className="page">
      <h1>Attendance reports</h1>
      <label className="select-label">
        Event
        <select value={eventId} onChange={(event) => setEventId(event.target.value)}>
          <option value="">Select an event</option>
          {events.map((event) => (
            <option value={event._id} key={event._id}>{event.title}</option>
          ))}
        </select>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {eventId && (
        <section className="panel">
          <div className="section-heading">
            <h2>Attendance</h2>
            <button type="button" onClick={exportCsv}>Export CSV</button>
          </div>
          {rows.length === 0
            ? <p>No attendance records found.</p>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User ID</th><th>Status</th></tr></thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.user_id}-${index}`}>
                        <td>{row.user_id}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}
    </main>
  );
}
