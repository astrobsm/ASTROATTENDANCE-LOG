import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchStaffCount } from '../store/slices/staffSlice';
import { fetchTodayAttendance } from '../store/slices/attendanceSlice';
import { Card, LoadingSpinner, Badge } from '../components/common';
import { Link } from 'react-router-dom';
import type { AttendanceLog } from '../types';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { role } = useAppSelector((state) => state.auth);
  const { staffCount, activeStaffCount, loading: staffLoading } = useAppSelector((state) => state.staff);
  const { logs: todayLogs, loading: attendanceLoading } = useAppSelector((state) => state.attendance);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    dispatch(fetchStaffCount());
    dispatch(fetchTodayAttendance());

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getClockedInCount = () => {
    return todayLogs.filter((log: AttendanceLog) => log.clockIn && !log.clockOut).length;
  };

  const getClockedOutCount = () => {
    return todayLogs.filter((log: AttendanceLog) => log.clockIn && log.clockOut).length;
  };

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo.png" 
              alt="AstroBSM Logo" 
              className="h-16 w-16 object-contain rounded-full bg-white p-1"
            />
            <div>
              <h1 className="text-2xl font-bold">Welcome to AstroBSM</h1>
              <p className="text-blue-100">{formatDate(currentTime)}</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="text-4xl font-bold font-mono">{formatTime(currentTime)}</div>
            <Badge variant="success" className="mt-1">System Online</Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Staff</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {staffLoading ? <LoadingSpinner size="sm" /> : staffCount}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Staff</p>
                  <p className="text-3xl font-bold text-green-600">
                    {staffLoading ? <LoadingSpinner size="sm" /> : activeStaffCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clocked In Today</p>
              <p className="text-3xl font-bold text-orange-600">
                {attendanceLoading ? <LoadingSpinner size="sm" /> : getClockedInCount()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-3xl font-bold text-purple-600">
                {attendanceLoading ? <LoadingSpinner size="sm" /> : getClockedOutCount()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/clock"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Clock In/Out</span>
            </Link>
            
            <Link
              to="/attendance-history"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-gray-900">View History</span>
            </Link>

            {isAdmin && (
              <>
                <Link
                  to="/staff/register"
                  className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Add Staff</span>
                </Link>

                <Link
                  to="/payroll"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Payroll</span>
                </Link>
              </>
            )}
          </div>
        </Card>

        {/* Today's Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h2>
          {attendanceLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : todayLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No attendance records for today</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {todayLogs.slice(0, 5).map((log: AttendanceLog) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{log.staffId}</p>
                    <p className="text-sm text-gray-500">
                      In: {log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    {log.clockOut ? (
                      <>
                        <Badge variant="success">Completed</Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {log.totalHours.toFixed(2)} hrs
                        </p>
                      </>
                    ) : (
                      <Badge variant="warning">Working</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
