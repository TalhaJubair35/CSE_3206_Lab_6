import React, { useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import AdminReports from './pages/AdminReports';
import Events from './pages/Events';
import Login from './pages/Login';
import OrganizerDashboard from './pages/OrganizerDashboard';
import { firebaseAuth } from './firebase';
import './styles.css';

function PrivateRoute() {
  return localStorage.getItem('token') ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('token')));
  async function logout() {
    localStorage.removeItem('token');
    if (firebaseAuth) {
      await signOut(firebaseAuth);
    }
    setAuthenticated(false);
  }

  return <>
    <nav className="navbar">
      <NavLink className="brand" to="/events">CampusEvents</NavLink>
      <div className="nav-links">
        <NavLink to="/events">Events</NavLink>
        {authenticated && <NavLink to="/organizer">Organizer</NavLink>}
        {authenticated && <NavLink to="/admin/reports">Reports</NavLink>}
        {authenticated ? <button className="text-button" onClick={logout}>Log out</button> : <NavLink to="/login">Log in</NavLink>}
      </div>
    </nav>
    <Routes>
      <Route path="/login" element={<Login onLogin={() => setAuthenticated(true)} />} />
      <Route element={<PrivateRoute />}>
        <Route path="/events" element={<Events />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  </>;
}
