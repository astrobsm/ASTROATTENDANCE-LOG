import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { showToast } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';
import { Card, Button, Input, Modal } from '../components/common';
import { clearDatabase, exportDatabase } from '../database';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { staffId, staffName, role } = useAppSelector((state) => state.auth);

  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    
    try {
      const data = await exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `astrobsm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      dispatch(showToast({
        type: 'success',
        message: 'Database exported successfully'
      }));
    } catch (error) {
      dispatch(showToast({
        type: 'error',
        message: 'Failed to export database'
      }));
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      dispatch(showToast({
        type: 'error',
        message: 'Please type the confirmation text correctly'
      }));
      return;
    }

    try {
      await clearDatabase();
      dispatch(showToast({
        type: 'success',
        message: 'All data has been cleared'
      }));
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      dispatch(showToast({
        type: 'error',
        message: 'Failed to clear database'
      }));
    } finally {
      setShowClearDataModal(false);
      setConfirmText('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage application settings and data</p>
      </div>

      {/* User Information */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xl text-blue-600 font-medium">
              {role === 'admin' ? 'AD' : staffName?.substring(0, 2).toUpperCase() || 'ST'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {role === 'admin' ? 'Administrator' : staffName}
            </p>
            {staffId && (
              <p className="text-sm text-gray-500 font-mono">{staffId}</p>
            )}
            <p className="text-sm text-gray-500 capitalize">Role: {role}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <Button variant="secondary" onClick={handleLogout}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </Card>

      {/* Application Info */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Information</h2>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">App Name</dt>
            <dd className="font-medium">AstroBSM Attendance Log</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Version</dt>
            <dd className="font-mono">1.0.0</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Default Hourly Rate</dt>
            <dd className="font-medium">₦425</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Fingerprint Service</dt>
            <dd className="font-mono text-sm">localhost:5000</dd>
          </div>
        </dl>
      </Card>

      {/* Data Management */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
        
        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Export Database</p>
              <p className="text-sm text-gray-500">Download a backup of all data as JSON</p>
            </div>
            <Button variant="secondary" onClick={handleExportData} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>

          {/* Clear Data */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-red-700">Clear All Data</p>
              <p className="text-sm text-red-600">Permanently delete all staff, attendance, and payroll data</p>
            </div>
            <Button variant="danger" onClick={() => setShowClearDataModal(true)}>
              Clear Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Fingerprint Service Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fingerprint Service</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-blue-700">Local Service Required</p>
              <p className="text-sm text-blue-600 mt-1">
                The fingerprint scanner requires a local service running on your computer.
                Make sure the fingerprint service is running at <code className="bg-blue-100 px-1 rounded">http://localhost:5000</code>
              </p>
              <div className="mt-3">
                <p className="text-sm text-blue-600 font-medium">To start the service:</p>
                <ol className="text-sm text-blue-600 mt-1 ml-4 list-decimal">
                  <li>Open a terminal in the fingerprint-service folder</li>
                  <li>Run: <code className="bg-blue-100 px-1 rounded">npm install</code></li>
                  <li>Run: <code className="bg-blue-100 px-1 rounded">npm start</code></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearDataModal}
        onClose={() => {
          setShowClearDataModal(false);
          setConfirmText('');
        }}
        title="Clear All Data"
      >
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-red-700">Warning: This action cannot be undone!</p>
                <p className="text-sm text-red-600 mt-1">
                  All staff records, attendance logs, payroll data, and payslips will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">
            To confirm, type <strong>DELETE ALL DATA</strong> below:
          </p>

          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE ALL DATA"
          />

          <div className="flex justify-end space-x-4 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setShowClearDataModal(false);
                setConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleClearData}
              disabled={confirmText !== 'DELETE ALL DATA'}
            >
              Delete All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
