import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { Navigate, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { firebaseAuth, isFirebaseConfigured } from '../firebase';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (localStorage.getItem('token')) return <Navigate to="/events" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!isFirebaseConfigured || !firebaseAuth) {
      setError('Firebase is not configured. Copy client/.env.example to client/.env and fill in your Firebase web app settings.');
      return;
    }

    setBusy(true);
    try {
      const credential = creatingAccount
        ? await createUserWithEmailAndPassword(firebaseAuth, email, password)
        : await signInWithEmailAndPassword(firebaseAuth, email, password);
      const token = await credential.user.getIdToken();
      const endpoint = creatingAccount ? '/auth/register' : '/auth/login';
      await client.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('token', token);
      onLogin();
      navigate('/events', { replace: true });
    } catch (requestError) {
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth);
      }
      localStorage.removeItem('token');
      setError(
        requestError.response?.data?.error ||
        requestError.message ||
        'Unable to authenticate. Check your Firebase Authentication settings.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page narrow">
      <h1>{creatingAccount ? 'Create account' : 'Log in'}</h1>
      <form className="panel form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={creatingAccount ? 'new-password' : 'current-password'}
            minLength="6"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : creatingAccount ? 'Create account' : 'Log in'}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => {
            setCreatingAccount((current) => !current);
            setError('');
          }}
        >
          {creatingAccount ? 'Already have an account? Log in' : 'New here? Create an account'}
        </button>
      </form>
    </main>
  );
}
