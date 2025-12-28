import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, UserRole } from '../../types';

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
  staffId: null,
  staffName: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginAsAdmin: (state) => {
      state.isAuthenticated = true;
      state.role = 'admin';
      state.staffId = null;
      state.staffName = 'Administrator';
    },
    loginAsStaff: (state, action: PayloadAction<{ staffId: string; staffName: string }>) => {
      state.isAuthenticated = true;
      state.role = 'staff';
      state.staffId = action.payload.staffId;
      state.staffName = action.payload.staffName;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.staffId = null;
      state.staffName = null;
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload;
    }
  }
});

export const { loginAsAdmin, loginAsStaff, logout, setRole } = authSlice.actions;
export default authSlice.reducer;
