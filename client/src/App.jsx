import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminReports from './pages/AdminReports';
import Events from './pages/Events';
import Login from './pages/Login';
import OrganizerDashboard from './pages/OrganizerDashboard';
import './styles.css';

function PrivateRoute() {
  return localStorage.getItem('token')
    ? <Outlet />
    : <Navigate to="/login" replace />;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    function syncAuthentication() {
      setAuthenticated(Boolean(localStorage.getItem('token')));
    }

    window.addEventListener('campusevents-auth-change', syncAuthentication);
    return () => window.removeEventListener('campusevents-auth-change', syncAuthentication);
  }, []);

  function logout() {
    localStorage.removeItem('token');
    setAuthenticated(false);
  }

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <NavLink className="brand" to="/events">CampusEvents</NavLink>
        <div className="nav-links">
          <NavLink to="/events">Events</NavLink>
          {authenticated && <NavLink to="/organizer">Organizer</NavLink>}
          {authenticated && <NavLink to="/admin/reports">Reports</NavLink>}
          {authenticated
            ? <button className="link-button" type="button" onClick={logout}>Log out</button>
            : <NavLink to="/login">Log in</NavLink>}
        </div>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/events" element={<Events />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </>
  );
}
