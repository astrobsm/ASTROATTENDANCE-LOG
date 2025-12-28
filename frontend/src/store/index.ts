import { configureStore } from '@reduxjs/toolkit';
import staffReducer from './slices/staffSlice';
import attendanceReducer from './slices/attendanceSlice';
import payrollReducer from './slices/payrollSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    staff: staffReducer,
    attendance: attendanceReducer,
    payroll: payrollReducer,
    auth: authReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['staff/setStaff', 'payroll/setPayrolls', 'payroll/setPayslips'],
        // Ignore these field paths in all actions
        ignoredPaths: ['staff.staff', 'payroll.payrolls', 'payroll.payslips']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
