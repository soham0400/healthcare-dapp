import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useWeb3 } from './context/Web3Context';
import { ROLES } from './config/constants';
import Header from './components/layout/Header';
import Registration from './pages/Registration';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import HospitalDashboard from './pages/dashboards/HospitalDashboard';
import PharmacyDashboard from './pages/dashboards/PharmacyDashboard';
import InsuranceDashboard from './pages/dashboards/insurancedashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { account, userRole } = useWeb3();

  if (!account || userRole === ROLES.NONE) {
    return <Navigate to="/register" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const { account, userRole, userData, disconnect, loading } = useWeb3();

  // Redirect to appropriate dashboard based on role
  const getDashboardPath = () => {
    switch (userRole) {
      case ROLES.PATIENT:
        return '/patient';
      case ROLES.DOCTOR:
        return '/doctor';
      case ROLES.HOSPITAL:
        return '/hospital';
      case ROLES.PHARMACY:
        return '/pharmacy';
      case ROLES.INSURANCE:
        return '/insurance';
      default:
        return '/register';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {account && userRole !== ROLES.NONE && (
        <Header 
          account={account}
          userRole={userRole}
          userData={userData}
          disconnect={disconnect}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Registration />} />

          {/* Default Route - Redirect to appropriate dashboard */}
          <Route 
            path="/" 
            element={
              account && userRole !== ROLES.NONE ? (
                <Navigate to={getDashboardPath()} replace />
              ) : (
                <Navigate to="/register" replace />
              )
            } 
          />

          {/* Protected Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hospital"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HOSPITAL]}>
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PHARMACY]}>
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/insurance"
            element={
              <ProtectedRoute allowedRoles={[ROLES.INSURANCE]}>
                <InsuranceDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;