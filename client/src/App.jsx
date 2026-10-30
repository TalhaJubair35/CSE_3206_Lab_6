import React, { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import client from './api/client';
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
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!authenticated) {
      setRole(null);
      return undefined;
    }

    let active = true;
    client.get('/auth/me')
      .then(({ data }) => {
        if (active) setRole(data.user.role);
      })
      .catch(() => {
        if (active) setRole(null);
      });

    return () => { active = false; };
  }, [authenticated]);

  async function logout() {
    localStorage.removeItem('token');
    if (firebaseAuth) {
      await signOut(firebaseAuth);
    }
    setAuthenticated(false);
    setRole(null);
  }

  return <>
    <nav className="navbar">
      <NavLink className="brand" to="/events">CampusEvents</NavLink>
      <div className="nav-links">
        <NavLink to="/events">Events</NavLink>
        {authenticated && ['organizer', 'admin'].includes(role) && <NavLink to="/organizer">Organizer</NavLink>}
        {authenticated && role === 'admin' && <NavLink to="/admin/reports">Reports</NavLink>}
        {authenticated ? <button className="text-button" onClick={logout}>Log out</button> : <NavLink to="/login">Log in</NavLink>}
      </div>
    </nav>
    <Routes>
      <Route path="/login" element={<Login onLogin={(userRole) => {
        setRole(userRole);
        setAuthenticated(true);
      }} />} />
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
