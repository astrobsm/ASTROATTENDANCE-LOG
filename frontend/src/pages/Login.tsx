import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginAsAdmin, loginAsStaff } from '../store/slices/authSlice';
import { showToast } from '../store/slices/uiSlice';
import { Button, Input, Card, LoadingSpinner } from '../components/common';
import { fingerprintService } from '../services';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading = false } = useAppSelector((state) => state.auth);

  const [loginMode, setLoginMode] = useState<'admin' | 'fingerprint'>('fingerprint');
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });
  const [verifying, setVerifying] = useState(false);

  // Admin login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple admin authentication (in production, use proper auth)
    if (adminCredentials.username === 'admin' && adminCredentials.password === 'astrobsm2024') {
      dispatch(loginAsAdmin());
      dispatch(showToast({ type: 'success', message: 'Welcome, Administrator!' }));
      navigate('/dashboard');
    } else {
      dispatch(showToast({ type: 'error', message: 'Invalid credentials' }));
    }
  };

  // Fingerprint login handler for staff
  const handleFingerprintLogin = async () => {
    setVerifying(true);
    
    try {
      const result = await fingerprintService.verifyFingerprint();
      
      if (result.success && result.staffId) {
        dispatch(loginAsStaff({ 
          staffId: result.staffId, 
          staffName: result.staffName || 'Staff' 
        }));
        dispatch(showToast({ type: 'success', message: `Welcome back, ${result.staffName}!` }));
        navigate('/clock');
      } else {
        dispatch(showToast({ type: 'error', message: result.error || 'Fingerprint verification failed' }));
      }
    } catch (error) {
      dispatch(showToast({ 
        type: 'error', 
        message: 'Fingerprint service unavailable. Please ensure the local service is running.' 
      }));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="AstroBSM Logo" 
              className="h-24 w-24 object-contain rounded-full shadow-xl bg-white p-2"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AstroBSM</h1>
          <p className="text-blue-200">Attendance Log System</p>
        </div>

        <Card className="p-8 shadow-2xl">
          {/* Login Mode Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLoginMode('fingerprint')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'fingerprint'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Staff Login
            </button>
            <button
              onClick={() => setLoginMode('admin')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin Login
            </button>
          </div>

          {loginMode === 'fingerprint' ? (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fingerprint Authentication
              </h3>
              <p className="text-gray-600 mb-6">
                Place your finger on the scanner to login
              </p>
              <Button
                onClick={handleFingerprintLogin}
                disabled={verifying}
                className="w-full"
                size="lg"
              >
                {verifying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Scan Fingerprint'
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin}>
              <div className="space-y-4">
                <Input
                  label="Username"
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) =>
                    setAdminCredentials((prev) => ({
                      ...prev,
                      username: e.target.value
                    }))
                  }
                  placeholder="Enter admin username"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) =>
                    setAdminCredentials((prev) => ({
                      ...prev,
                      password: e.target.value
                    }))
                  }
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6"
                size="lg"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Logging in...
                  </>
                ) : (
                  'Login as Admin'
                )}
              </Button>
            </form>
          )}
        </Card>

        <p className="text-center text-blue-200 text-sm mt-6">
          &copy; 2024 AstroBSM. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
