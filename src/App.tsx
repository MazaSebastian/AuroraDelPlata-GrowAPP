import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
// import LiveChat from './components/LiveChat'; // Disabling LiveChat for CRM cleanup
import Dashboard from './pages/Dashboard';
import Crops from './pages/Crops';
import CropDetail from './pages/CropDetail';
import Rooms from './pages/Rooms';

import RoomDetail from './pages/RoomDetail';
import Genetics from './pages/Genetics';
import Clones from './pages/Clones';
import Devices from './pages/Devices';
import { ExtractionsPage as Extractions } from './pages/Extractions';

import Stock from './pages/Stock';
import Dispensary from './pages/Dispensary';
import Settings from './pages/Settings';
import Compras from './pages/Compras';
import Insumos from './pages/Insumos';
import Expenses from './pages/Expenses';
import Metrics from './pages/Metrics'; // New Import
import Patients from './pages/Patients';
import ClinicalFollowUp from './pages/ClinicalFollowUp';
import { notificationService } from './services/notificationService';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import './App.css';

import Sidebar from './components/Sidebar';

import { ChatWidget } from './components/AI/ChatWidget';

const MainContent = styled.main`
  margin-left: 260px;
  padding: 2rem;
  min-height: 100vh;
  background-color: #f8fafc;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 1rem;
    padding-top: 5rem; /* Space for MobileHeader */
  }
`;

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    // Init Notifications
    const initNotifications = async () => {
      await notificationService.init();
    };
    initNotifications();
  }, []);

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="App">
      {!isLogin && <Sidebar />}
      {!isLogin && <ChatWidget />}

      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes Wrapped in Main Content */}
        <Route path="/" element={
          <RequireAuth>
            <MainContent>
              <Dashboard />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/crops" element={
          <RequireAuth>
            <MainContent>
              <Crops />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/crops/:id" element={
          <RequireAuth>
            <MainContent>
              <CropDetail />
            </MainContent>
          </RequireAuth>
        } />

        <Route path="/rooms" element={
          <RequireAuth>
            <MainContent>
              <Rooms />
            </MainContent>
          </RequireAuth>
        } />

        <Route path="/rooms/:id" element={
          <RequireAuth>
            <MainContent>
              <RoomDetail />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/genetics" element={
          <RequireAuth>
            <MainContent>
              <Genetics />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/clones" element={
          <RequireAuth>
            <MainContent>
              <Clones />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/devices" element={
          <RequireAuth>
            <MainContent>
              <Devices />
            </MainContent>
          </RequireAuth>
        } />

        <Route path="/extractions" element={
          <RequireAuth>
            <MainContent>
              <Extractions />
            </MainContent>
          </RequireAuth>
        } />

        <Route path="/stock" element={
          <RequireAuth>
            <MainContent>
              <Stock />
            </MainContent>
          </RequireAuth>
        } />

        <Route path="/dispensary" element={
          <RequireAuth>
            <MainContent>
              <Dispensary />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/settings" element={
          <RequireAuth>
            <MainContent>
              <Settings />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/insumos" element={
          <RequireAuth>
            <MainContent>
              <Insumos />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/compras" element={
          <RequireAuth>
            <MainContent>
              <Compras />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/expenses" element={
          <RequireAuth>
            <MainContent>
              <Expenses />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/patients" element={
          <RequireAuth>
            <MainContent>
              <Patients />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/patients/:id/clinical" element={
          <RequireAuth>
            <MainContent>
              <ClinicalFollowUp />
            </MainContent>
          </RequireAuth>
        } />
        <Route path="/metrics" element={
          <RequireAuth>
            <MainContent>
              <Metrics />
            </MainContent>
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}


export default App;
