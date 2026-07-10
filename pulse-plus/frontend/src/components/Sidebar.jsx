import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINK = ({ to, label }) => (
  <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
    {label}
  </NavLink>
);

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav className="sidebar">
      {LINK({ to: '/', label: 'Dashboard' })}
      {LINK({ to: '/doc-reports', label: 'Documentation Reports' })}
      {LINK({ to: '/rpfp', label: 'RPFP Records' })}
      {(user.role === 'section_head' || user.role === 'population_officer') &&
        LINK({ to: '/review', label: 'Review & Approval' })}
      {LINK({ to: '/summary', label: 'Monthly Summary' })}
      {user.role === 'admin' && LINK({ to: '/admin', label: 'Reference Data & Users' })}
    </nav>
  );
}
