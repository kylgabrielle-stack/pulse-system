import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-mark large">P+</div>
        <h1>PULSE+</h1>
        <p className="login-tagline">Empowering Communities through Population Insights</p>
        <p className="login-sub">Provincial Population Office (OPPO) monitoring &amp; information system</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-demo">
          <div className="login-demo-title">Demo accounts</div>
          <ul>
            <li><strong>admin</strong> / admin123 &mdash; Admin</li>
            <li><strong>staff</strong> / staff123 &mdash; Technical Section Staff</li>
            <li><strong>sectionhead</strong> / head123 &mdash; Technical Section Head</li>
            <li><strong>popofficer</strong> / officer123 &mdash; Provincial Population Officer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
