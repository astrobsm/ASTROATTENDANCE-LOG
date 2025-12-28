import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clockInStaff, clockOutStaff, fetchAttendanceStatus, clearLastAction } from '../store/slices/attendanceSlice';
import { showToast } from '../store/slices/uiSlice';
import { Card, Button, LoadingSpinner, Badge } from '../components/common';
import { fingerprintService } from '../services';
import { AttendanceStatus } from '../types';

const ClockInOut: React.FC = () => {
  const dispatch = useAppDispatch();
  const { role, staffId: authStaffId, staffName } = useAppSelector((state) => state.auth);
  const { todayStatus, loading, error, lastAction } = useAppSelector((state) => state.attendance);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [verifying, setVerifying] = useState(false);
  const [actionType, setActionType] = useState<'clock-in' | 'clock-out' | null>(null);

  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch attendance status for logged-in staff
  useEffect(() => {
    if (authStaffId) {
      dispatch(fetchAttendanceStatus(authStaffId));
    }
  }, [authStaffId, dispatch, lastAction]);

  // Clear last action after showing
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => {
        dispatch(clearLastAction());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAction, dispatch]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleClockAction = async (action: 'clock-in' | 'clock-out') => {
    setActionType(action);
    setVerifying(true);

    try {
      // Verify fingerprint first
      const result = await fingerprintService.verifyFingerprint();

      if (!result.success || !result.staffId) {
        dispatch(showToast({
          type: 'error',
          message: result.error || 'Fingerprint verification failed'
        }));
        return;
      }

      // Check if admin is doing action for another staff or staff for themselves
      const targetStaffId = result.staffId;

      if (action === 'clock-in') {
        await dispatch(clockInStaff(targetStaffId)).unwrap();
        dispatch(showToast({
          type: 'success',
          message: `Clock-in successful at ${formatTime(new Date())}`
        }));
      } else {
        await dispatch(clockOutStaff(targetStaffId)).unwrap();
        dispatch(showToast({
          type: 'success',
          message: `Clock-out successful at ${formatTime(new Date())}`
        }));
      }

      // Refresh status if it's the current user
      if (targetStaffId === authStaffId) {
        dispatch(fetchAttendanceStatus(authStaffId));
      }
    } catch (error: any) {
      dispatch(showToast({
        type: 'error',
        message: error.message || `Failed to ${action}`
      }));
    } finally {
      setVerifying(false);
      setActionType(null);
    }
  };

  const getStatusInfo = (status: AttendanceStatus | null) => {
    if (!status) {
      return {
        text: 'Not Clocked In',
        color: 'gray',
        canClockIn: true,
        canClockOut: false
      };
    }

    if (status.isClockedIn && !status.clockOutTime) {
      return {
        text: 'Currently Working',
        color: 'green',
        canClockIn: false,
        canClockOut: true
      };
    }

    if (status.clockInTime && status.clockOutTime) {
      return {
        text: 'Completed for Today',
        color: 'blue',
        canClockIn: false,
        canClockOut: false
      };
    }

    return {
      text: 'Not Clocked In',
      color: 'gray',
      canClockIn: true,
      canClockOut: false
    };
  };

  const statusInfo = getStatusInfo(todayStatus);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Clock In / Out</h1>
        <p className="text-gray-600">Record your attendance with fingerprint verification</p>
      </div>

      {/* Current Time Display */}
      <Card className="p-8 mb-6 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <p className="text-blue-100 mb-2">{formatDate(currentTime)}</p>
        <div className="text-6xl font-bold font-mono mb-4">
          {formatTime(currentTime)}
        </div>
        {staffName && (
          <p className="text-blue-100">
            Welcome, <span className="font-semibold text-white">{staffName}</span>
          </p>
        )}
      </Card>

      {/* Status Card */}
      {authStaffId && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Status</h2>
          
          {loading && !verifying ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Status</span>
                <Badge
                  variant={
                    statusInfo.color === 'green'
                      ? 'success'
                      : statusInfo.color === 'blue'
                      ? 'info'
                      : 'warning'
                  }
                >
                  {statusInfo.text}
                </Badge>
              </div>

              {todayStatus?.clockInTime && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Clock In Time</span>
                  <span className="font-mono font-medium text-green-700">
                    {new Date(todayStatus.clockInTime).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {todayStatus?.clockOutTime && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Clock Out Time</span>
                  <span className="font-mono font-medium text-blue-700">
                    {new Date(todayStatus.clockOutTime).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {todayStatus?.totalHours !== undefined && todayStatus.totalHours > 0 && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="text-gray-600">Hours Worked</span>
                  <span className="font-mono font-medium text-purple-700">
                    {todayStatus.totalHours.toFixed(2)} hours
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Scan Fingerprint to Clock In/Out
        </h2>

        <div className="flex justify-center mb-6">
          <svg
            className={`w-24 h-24 ${verifying ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}
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

        {verifying && (
          <div className="text-center mb-6">
            <LoadingSpinner size="md" className="mx-auto mb-2" />
            <p className="text-gray-600">
              {actionType === 'clock-in' ? 'Processing Clock In...' : 'Processing Clock Out...'}
            </p>
          </div>
        )}

        {lastAction && (
          <div className={`text-center mb-6 p-4 rounded-lg ${
            lastAction === 'clock-in' ? 'bg-green-50' : 'bg-blue-50'
          }`}>
            <svg
              className={`w-12 h-12 mx-auto mb-2 ${
                lastAction === 'clock-in' ? 'text-green-600' : 'text-blue-600'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`font-medium ${lastAction === 'clock-in' ? 'text-green-700' : 'text-blue-700'}`}>
              {lastAction === 'clock-in' ? 'Clocked In Successfully!' : 'Clocked Out Successfully!'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleClockAction('clock-in')}
            disabled={verifying || (authStaffId !== null && !statusInfo.canClockIn)}
            className="py-4"
            variant="success"
            size="lg"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Clock In
          </Button>

          <Button
            onClick={() => handleClockAction('clock-out')}
            disabled={verifying || (authStaffId !== null && !statusInfo.canClockOut)}
            className="py-4"
            variant="danger"
            size="lg"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Clock Out
          </Button>
        </div>

        {role === 'admin' && (
          <p className="text-center text-gray-500 text-sm mt-4">
            As an admin, you can process clock in/out for any staff member
          </p>
        )}
      </Card>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ClockInOut;
