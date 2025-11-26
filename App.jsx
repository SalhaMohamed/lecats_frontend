import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './components/public/LandingPage';


import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import CRDashboard from './components/dashboards/CRDashboard';
import LecturerDashboard from './components/dashboards/LecturerDashboard';
import HODDashboard from './components/dashboards/HODDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Routes>
        {/* --- Public Page --- */}
        
        <Route path="/" element={<LandingPage />} />

        {/* --- Protected Dashboard Pages --- */}
        {/* These routes are wrapped in a layout that includes the main navbar */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/hod" element={<HODDashboard />} />
            <Route path="/lecturer" element={<LecturerDashboard />} />
            <Route path="/cr" element={<CRDashboard />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;