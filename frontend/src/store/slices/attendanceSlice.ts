import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceLog, AttendanceStatus, MonthlyAttendanceSummary } from '../../types';
import * as dbOps from '../../database';

interface AttendanceState {
  logs: AttendanceLog[];
  todayStatus: AttendanceStatus | null;
  monthlySummary: MonthlyAttendanceSummary | null;
  loading: boolean;
  error: string | null;
  lastAction: 'clock-in' | 'clock-out' | null;
}

const initialState: AttendanceState = {
  logs: [],
  todayStatus: null,
  monthlySummary: null,
  loading: false,
  error: null,
  lastAction: null
};

// Async thunks
export const clockInStaff = createAsyncThunk(
  'attendance/clockIn',
  async (staffId: string) => {
    const log = await dbOps.clockIn(staffId);
    return log;
  }
);

export const clockOutStaff = createAsyncThunk(
  'attendance/clockOut',
  async (staffId: string) => {
    const log = await dbOps.clockOut(staffId);
    return log;
  }
);

export const fetchAttendanceStatus = createAsyncThunk(
  'attendance/fetchStatus',
  async (staffId: string) => {
    const status = await dbOps.getAttendanceStatus(staffId);
    return status;
  }
);

export const fetchAttendanceLogs = createAsyncThunk(
  'attendance/fetchLogs',
  async (staffId: string) => {
    const logs = await dbOps.getAttendanceLogsByStaff(staffId);
    return logs;
  }
);

export const fetchAttendanceByDateRange = createAsyncThunk(
  'attendance/fetchByDateRange',
  async ({ staffId, startDate, endDate }: { staffId: string; startDate: string; endDate: string }) => {
    const logs = await dbOps.getAttendanceLogsByDateRange(staffId, startDate, endDate);
    return logs;
  }
);

export const fetchMonthlyAttendance = createAsyncThunk(
  'attendance/fetchMonthly',
  async ({ staffId, month }: { staffId: string; month: string }) => {
    const logs = await dbOps.getAttendanceLogsByMonth(staffId, month);
    return logs;
  }
);

export const fetchMonthlySummary = createAsyncThunk(
  'attendance/fetchMonthlySummary',
  async ({ staffId, month }: { staffId: string; month: string }) => {
    const summary = await dbOps.getMonthlyAttendanceSummary(staffId, month);
    return summary;
  }
);

export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchToday',
  async () => {
    const today = dbOps.getTodayDate();
    const logs = await dbOps.getAttendanceLogsByDate(today);
    return logs;
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLastAction: (state) => {
      state.lastAction = null;
    },
    setLogs: (state, action: PayloadAction<AttendanceLog[]>) => {
      state.logs = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Clock in
      .addCase(clockInStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clockInStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.lastAction = 'clock-in';
        state.logs.unshift(action.payload);
        if (state.todayStatus) {
          state.todayStatus.clockedIn = true;
          state.todayStatus.clockInTime = action.payload.clockIn;
        }
      })
      .addCase(clockInStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to clock in';
      })
      // Clock out
      .addCase(clockOutStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clockOutStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.lastAction = 'clock-out';
        const index = state.logs.findIndex(log => log.id === action.payload.id);
        if (index !== -1) {
          state.logs[index] = action.payload;
        }
        if (state.todayStatus) {
          state.todayStatus.clockedOut = true;
          state.todayStatus.clockOutTime = action.payload.clockOut;
          state.todayStatus.totalHours = action.payload.totalHours;
        }
      })
      .addCase(clockOutStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to clock out';
      })
      // Fetch status
      .addCase(fetchAttendanceStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.todayStatus = action.payload;
      })
      .addCase(fetchAttendanceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch status';
      })
      // Fetch logs
      .addCase(fetchAttendanceLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchAttendanceLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch logs';
      })
      // Fetch by date range
      .addCase(fetchAttendanceByDateRange.fulfilled, (state, action) => {
        state.logs = action.payload;
      })
      // Fetch monthly
      .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
        state.logs = action.payload;
      })
      // Fetch monthly summary
      .addCase(fetchMonthlySummary.fulfilled, (state, action) => {
        state.monthlySummary = action.payload;
      })
      // Fetch today
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.logs = action.payload;
      });
  }
});

export const { clearError, clearLastAction, setLogs } = attendanceSlice.actions;
export default attendanceSlice.reducer;
