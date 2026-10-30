import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { Navigate, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { firebaseAuth, isFirebaseConfigured } from '../firebase';

function getAuthErrorMessage(error, creatingAccount) {
  if (error.code === 'ERR_NETWORK' && !error.response) {
    return `Cannot reach the CampusEvents API at ${client.defaults.baseURL}. Start the server in a separate terminal with: cd server, then npm run dev. Ensure server/.env has a working MONGO_URI.`;
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Firebase could not sign you in with that email and password. Check both, or choose “Create an account” if you have not registered with Firebase yet.';
    case 'auth/email-already-in-use':
      return 'This email already has a Firebase account. Switch to Log in instead.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled. Enable the Email/Password provider in Firebase Console → Authentication → Sign-in method.';
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
      return 'This app is not authorized by Firebase. Check the Firebase web app settings in client/.env and restart Vite.';
    case 'auth/network-request-failed':
      return 'Firebase could not be reached. Check your internet connection and try again.';
    default:
      if (error.response) {
        return error.response.data?.error || 'The API could not complete authentication. Check that the server is running.';
      }
      return error.message || (creatingAccount ? 'Unable to create the account.' : 'Unable to log in.');
  }
}

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (localStorage.getItem('token')) return <Navigate to="/events" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');

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
      const { data } = await client.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('token', token);
      onLogin(data.user.role);
      navigate('/events', { replace: true });
    } catch (requestError) {
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth);
      }
      localStorage.removeItem('token');
      setError(
        requestError.response?.data?.error ||
        getAuthErrorMessage(requestError, creatingAccount) ||
        'Unable to authenticate. Check your Firebase Authentication settings.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    setError('');
    setNotice('');

    if (!isFirebaseConfigured || !firebaseAuth) {
      setError('Firebase is not configured. Check the client/.env Firebase settings.');
      return;
    }

    if (!email.trim()) {
      setError('Enter your account email first so Firebase knows where to send the reset link.');
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setNotice('If this email has a Firebase account, a password reset link has been sent.');
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, false));
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
        {notice && <p className="success" role="status">{notice}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : creatingAccount ? 'Create account' : 'Log in'}
        </button>
        {!creatingAccount && (
          <button type="button" className="text-button" disabled={busy} onClick={sendPasswordReset}>
            Forgot password?
          </button>
        )}
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
