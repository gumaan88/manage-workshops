import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkshopsListPage } from './pages/WorkshopsListPage';
import { WorkshopDetailPage } from './pages/WorkshopDetailPage';
import { LiveSessionPage } from './pages/LiveSessionPage';
import { ParticipantRoomPage } from './pages/ParticipantRoomPage';
import { ReportsPage } from './pages/ReportsPage';
import { CertificateVerifyPage } from './pages/CertificateVerifyPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public / Standalone Views */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/participant/:id" element={<ParticipantRoomPage />} />
      <Route path="/certificates/verify/:code" element={<CertificateVerifyPage />} />

      {/* Main Admin / Facilitator Layout Views */}
      <Route path="/" element={<Navigate to="/workshops" replace />} />
      <Route
        path="/workspaces"
        element={
          <Layout>
            <WorkspacesPage />
          </Layout>
        }
      />
      <Route
        path="/workshops"
        element={
          <Layout>
            <WorkshopsListPage />
          </Layout>
        }
      />
      <Route
        path="/workshops/:id"
        element={
          <Layout>
            <WorkshopDetailPage />
          </Layout>
        }
      />
      <Route
        path="/live/:id"
        element={
          <Layout>
            <LiveSessionPage />
          </Layout>
        }
      />
      <Route
        path="/reports/:workshopId"
        element={
          <Layout>
            <ReportsPage />
          </Layout>
        }
      />
      <Route
        path="/reports"
        element={
          <Layout>
            <WorkshopsListPage />
          </Layout>
        }
      />

      <Route path="*" element={<Navigate to="/workshops" replace />} />
    </Routes>
  );
};
