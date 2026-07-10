import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ROLE_LABELS } from '../context/AuthContext.jsx';

const TABS = ['Users', 'Barangays', 'Personnel', 'FP Methods'];

export default function Admin() {
  const [tab, setTab] = useState('Users');
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reference Data &amp; Users</h1>
          <p className="page-subtitle">Manage dropdown source lists and user accounts.</p>
        </div>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Users' && <UsersTab />}
      {tab === 'Barangays' && <BarangaysTab />}
      {tab === 'Personnel' && <PersonnelTab />}
      {tab === 'FP Methods' && <FpMethodsTab />}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'staff' });
  const [error, setError] = useState('');

  function load() { api.get('/admin/users').then(setUsers).catch((e) => setError(e.message)); }
  useEffect(load, []);

  async function addUser(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/users', form);
      setForm({ username: '', password: '', fullName: '', role: 'staff' });
      load();
    } catch (err) { setError(err.message); }
  }

  async function removeUser(id) {
    if (!confirm('Delete this user account?')) return;
    try { await api.del(`/admin/users/${id}`); load(); } catch (err) { alert(err.message); }
  }

  return (
    <div className="panel">
      {error && <div className="alert alert-error">{error}</div>}
      <form className="inline-form" onSubmit={addUser}>
        <input placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
        <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
        <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Add User</button>
      </form>
      <table className="data-table">
        <thead><tr><th>Username</th><th>Full Name</th><th>Role</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td><td>{u.fullName}</td><td>{ROLE_LABELS[u.role]}</td>
              <td><button className="btn btn-sm btn-danger" onClick={() => removeUser(u.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarangaysTab() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ municipality: '', barangay: '' });
  const [error, setError] = useState('');

  function load() { api.get('/admin/barangays').then(setRows).catch((e) => setError(e.message)); }
  useEffect(load, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    try { await api.post('/admin/barangays', form); setForm({ municipality: '', barangay: '' }); load(); }
    catch (err) { setError(err.message); }
  }
  async function remove(id) { try { await api.del(`/admin/barangays/${id}`); load(); } catch (err) { alert(err.message); } }

  return (
    <div className="panel">
      {error && <div className="alert alert-error">{error}</div>}
      <form className="inline-form" onSubmit={add}>
        <input placeholder="Municipality" value={form.municipality} onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))} required />
        <input placeholder="Barangay" value={form.barangay} onChange={(e) => setForm((f) => ({ ...f, barangay: e.target.value }))} required />
        <button className="btn btn-primary" type="submit">Add</button>
      </form>
      <table className="data-table">
        <thead><tr><th>Municipality</th><th>Barangay</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}><td>{r.municipality}</td><td>{r.barangay}</td>
              <td><button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonnelTab() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ fullName: '', position: '' });
  const [error, setError] = useState('');

  function load() { api.get('/admin/personnel').then(setRows).catch((e) => setError(e.message)); }
  useEffect(load, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    try { await api.post('/admin/personnel', form); setForm({ fullName: '', position: '' }); load(); }
    catch (err) { setError(err.message); }
  }
  async function remove(id) { try { await api.del(`/admin/personnel/${id}`); load(); } catch (err) { alert(err.message); } }

  return (
    <div className="panel">
      {error && <div className="alert alert-error">{error}</div>}
      <form className="inline-form" onSubmit={add}>
        <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
        <input placeholder="Position" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
        <button className="btn btn-primary" type="submit">Add</button>
      </form>
      <table className="data-table">
        <thead><tr><th>Full Name</th><th>Position</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}><td>{r.fullName}</td><td>{r.position}</td>
              <td><button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FpMethodsTab() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ code: '', label: '', category: 'Artificial' });
  const [error, setError] = useState('');

  function load() { api.get('/admin/fp-methods').then(setRows).catch((e) => setError(e.message)); }
  useEffect(load, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    try { await api.post('/admin/fp-methods', form); setForm({ code: '', label: '', category: 'Artificial' }); load(); }
    catch (err) { setError(err.message); }
  }
  async function remove(id) { try { await api.del(`/admin/fp-methods/${id}`); load(); } catch (err) { alert(err.message); } }

  return (
    <div className="panel">
      {error && <div className="alert alert-error">{error}</div>}
      <form className="inline-form" onSubmit={add}>
        <input placeholder="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required style={{ maxWidth: 80 }} />
        <input placeholder="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
        <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          <option value="Artificial">Artificial</option>
          <option value="Modern NFP">Modern NFP</option>
        </select>
        <button className="btn btn-primary" type="submit">Add</button>
      </form>
      <table className="data-table">
        <thead><tr><th>Code</th><th>Label</th><th>Category</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}><td>{r.code}</td><td>{r.label}</td><td>{r.category}</td>
              <td><button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
