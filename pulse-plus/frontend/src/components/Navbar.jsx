import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-mark">P+</div>
        <div>
          <div className="brand-title">PULSE+</div>
          <div className="brand-sub">Empowering Communities through Population Insights</div>
        </div>
      </div>
      {user && (
        <div className="navbar-user">
          <div className="navbar-user-info">
            <div className="navbar-user-name">{user.fullName}</div>
            <div className="navbar-user-role">{ROLE_LABELS[user.role]}</div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
