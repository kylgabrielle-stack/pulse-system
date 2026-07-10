import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DocReportList from './pages/DocReportList.jsx';
import DocReportForm from './pages/DocReportForm.jsx';
import RPFPList from './pages/RPFPList.jsx';
import RPFPForm from './pages/RPFPForm.jsx';
import RecordDetails from './pages/RecordDetails.jsx';
import ReviewApproval from './pages/ReviewApproval.jsx';
import MonthlySummary from './pages/MonthlySummary.jsx';
import Admin from './pages/Admin.jsx';

function Shell({ children }) {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        {user && <Sidebar />}
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Shell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/doc-reports" element={<DocReportList />} />
                <Route
                  path="/doc-reports/new"
                  element={
                    <ProtectedRoute roles={['staff']}>
                      <DocReportForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doc-reports/:id/edit"
                  element={
                    <ProtectedRoute roles={['staff']}>
                      <DocReportForm />
                    </ProtectedRoute>
                  }
                />
                <Route path="/doc-reports/:id" element={<RecordDetails type="docReport" />} />

                <Route path="/rpfp" element={<RPFPList />} />
                <Route
                  path="/rpfp/new"
                  element={
                    <ProtectedRoute roles={['staff']}>
                      <RPFPForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rpfp/:id/edit"
                  element={
                    <ProtectedRoute roles={['staff']}>
                      <RPFPForm />
                    </ProtectedRoute>
                  }
                />
                <Route path="/rpfp/:id" element={<RecordDetails type="rpfp" />} />

                <Route
                  path="/review"
                  element={
                    <ProtectedRoute roles={['section_head', 'population_officer']}>
                      <ReviewApproval />
                    </ProtectedRoute>
                  }
                />
                <Route path="/summary" element={<MonthlySummary />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Shell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
