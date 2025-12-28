import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { MainLayout } from './components/layout';
import { LoadingSpinner, Toast } from './components/common';
import { SetupWizard } from './components/setup';
import { clearToast } from './store/slices/uiSlice';
import { fingerprintService } from './services';

// Pages - Lazy loaded for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const StaffRegistration = React.lazy(() => import('./pages/StaffRegistration'));
const StaffList = React.lazy(() => import('./pages/StaffList'));
const ClockInOut = React.lazy(() => import('./pages/ClockInOut'));
const AttendanceHistory = React.lazy(() => import('./pages/AttendanceHistory'));
const PayrollGeneration = React.lazy(() => import('./pages/PayrollGeneration'));
const PayslipViewer = React.lazy(() => import('./pages/PayslipViewer'));
const Login = React.lazy(() => import('./pages/Login'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'staff')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
);

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useAppSelector((state) => state.ui);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Setup wizard state
  const [setupComplete, setSetupComplete] = useState<boolean>(() => {
    // Check if user has already completed setup or skipped it
    return localStorage.getItem('astrobsm_setup_complete') === 'true';
  });
  const [checkingSetup, setCheckingSetup] = useState(!setupComplete);

  // Check fingerprint service on mount
  useEffect(() => {
    if (!setupComplete) {
      const checkService = async () => {
        try {
          const status = await fingerprintService.checkStatus();
          if (status.connected && status.deviceReady) {
            setSetupComplete(true);
            localStorage.setItem('astrobsm_setup_complete', 'true');
          }
        } catch {
          // Service not running
        }
        setCheckingSetup(false);
      };
      checkService();
    }
  }, [setupComplete]);

  const handleSetupComplete = () => {
    setSetupComplete(true);
    localStorage.setItem('astrobsm_setup_complete', 'true');
  };

  const handleSetupSkip = () => {
    setSetupComplete(true);
    localStorage.setItem('astrobsm_setup_complete', 'true');
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(clearToast());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  // Show setup wizard if not complete and still checking
  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show setup wizard if service not detected and setup not complete
  if (!setupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} onSkip={handleSetupSkip} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => dispatch(clearToast())}
        />
      )}

      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />

          {/* Protected routes wrapped in MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Staff Clock In/Out - accessible by both admin and staff */}
            <Route path="clock" element={<ClockInOut />} />
            <Route path="attendance-history" element={<AttendanceHistory />} />
            
            {/* Admin only routes */}
            <Route
              path="staff/register"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StaffRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/list"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StaffList />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PayrollGeneration />
                </ProtectedRoute>
              }
            />
            <Route
              path="payslips"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PayslipViewer />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to dashboard or login */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </React.Suspense>
    </div>
  );
};

export default App;
