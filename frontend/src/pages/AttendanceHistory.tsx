import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAttendanceLogs, fetchMonthlySummary } from '../store/slices/attendanceSlice';
import { fetchAllStaff } from '../store/slices/staffSlice';
import { Card, LoadingSpinner, Badge } from '../components/common';
import type { AttendanceLog, Staff } from '../types';

const AttendanceHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { role, staffId: authStaffId } = useAppSelector((state) => state.auth);
  const { logs, monthlySummary, loading } = useAppSelector((state) => state.attendance);
  const { staff } = useAppSelector((state) => state.staff);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(authStaffId || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchAllStaff());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (selectedStaffId) {
      dispatch(fetchAttendanceLogs(selectedStaffId));
      dispatch(fetchMonthlySummary({ staffId: selectedStaffId, month: selectedMonth }));
    }
  }, [dispatch, selectedStaffId, selectedMonth]);

  // Set default staff ID when staff list loads
  useEffect(() => {
    if (!selectedStaffId && staff.length > 0) {
      setSelectedStaffId(staff[0].id);
    }
  }, [staff, selectedStaffId]);

  // Non-admin users can only see their own data
  useEffect(() => {
    if (!isAdmin && authStaffId) {
      setSelectedStaffId(authStaffId);
    }
  }, [isAdmin, authStaffId]);

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  const filteredLogs = logs.filter((log: AttendanceLog) => {
    return log.date.startsWith(selectedMonth);
  });

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedStaff = staff.find((s: Staff) => s.id === selectedStaffId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-600">View attendance records and monthly summary</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select staff</option>
                {staff.map((s: Staff) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Monthly Summary */}
      {monthlySummary && selectedStaffId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Days Present</p>
            <p className="text-2xl font-bold text-green-600">{monthlySummary.daysPresent}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total Hours</p>
            <p className="text-2xl font-bold text-blue-600">
              {monthlySummary.totalHours.toFixed(2)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Average Hours/Day</p>
            <p className="text-2xl font-bold text-purple-600">
              {monthlySummary.daysPresent > 0 
                ? (monthlySummary.totalHours / monthlySummary.daysPresent).toFixed(2)
                : '0.00'
              }
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Estimated Earnings</p>
            <p className="text-2xl font-bold text-orange-600">
              ₦{(monthlySummary.totalHours * (selectedStaff?.hourlyRate || 425)).toLocaleString()}
            </p>
          </Card>
        </div>
      )}

      {/* Attendance Records Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !selectedStaffId ? (
        <Card className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500">Select a staff member to view attendance history</p>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">No attendance records found for this period</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log: AttendanceLog) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-green-600">
                        {formatTime(log.clockIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-blue-600">
                        {formatTime(log.clockOut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-medium">
                        {log.totalHours.toFixed(2)} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.clockIn && log.clockOut ? (
                        <Badge variant="success">Complete</Badge>
                      ) : log.clockIn && !log.clockOut ? (
                        <Badge variant="warning">In Progress</Badge>
                      ) : (
                        <Badge variant="error">Incomplete</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttendanceHistory;
