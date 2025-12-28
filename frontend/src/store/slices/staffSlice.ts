import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Staff } from '../../types';
import * as dbOps from '../../database';

interface CreateStaffInput {
  staffId?: string;  // Optional - will be generated if not provided
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  hourlyRate: number;
  fingerprintTemplateId: string;
}

interface StaffState {
  staff: Staff[];
  selectedStaff: Staff | null;
  loading: boolean;
  error: string | null;
  departments: string[];
  staffCount: number;
  activeStaffCount: number;
}

const initialState: StaffState = {
  staff: [],
  selectedStaff: null,
  loading: false,
  error: null,
  departments: [],
  staffCount: 0,
  activeStaffCount: 0
};

// Async thunks
export const fetchAllStaff = createAsyncThunk(
  'staff/fetchAll',
  async () => {
    const staff = await dbOps.getAllStaff();
    return staff;
  }
);

export const fetchStaffById = createAsyncThunk(
  'staff/fetchById',
  async (id: string) => {
    const staff = await dbOps.getStaffById(id);
    if (!staff) {
      throw new Error(`Staff with ID ${id} not found`);
    }
    return staff;
  }
);

export const fetchStaffCount = createAsyncThunk(
  'staff/fetchCount',
  async () => {
    const [total, active] = await Promise.all([
      dbOps.getStaffCount(),
      dbOps.getActiveStaffCount()
    ]);
    return { total, active };
  }
);

export const createNewStaff = createAsyncThunk(
  'staff/create',
  async (input: CreateStaffInput) => {
    const { fingerprintTemplateId, staffId, ...staffData } = input;
    const staff = await dbOps.createStaff(staffData, fingerprintTemplateId, staffId);
    return staff;
  }
);

export const toggleStaffStatus = createAsyncThunk(
  'staff/toggleStatus',
  async ({ staffId, isActive }: { staffId: string; isActive: boolean }) => {
    if (isActive) {
      await dbOps.reactivateStaff(staffId);
    } else {
      await dbOps.deactivateStaff(staffId);
    }
    return { staffId, isActive };
  }
);

export const updateExistingStaff = createAsyncThunk(
  'staff/update',
  async (payload: { id: string; firstName?: string; lastName?: string; department?: string; role?: string; hourlyRate?: number }) => {
    const staff = await dbOps.updateStaff(payload);
    return staff;
  }
);

export const deactivateStaffMember = createAsyncThunk(
  'staff/deactivate',
  async (id: string) => {
    await dbOps.deactivateStaff(id);
    return id;
  }
);

export const reactivateStaffMember = createAsyncThunk(
  'staff/reactivate',
  async (id: string) => {
    await dbOps.reactivateStaff(id);
    return id;
  }
);

export const fetchDepartments = createAsyncThunk(
  'staff/fetchDepartments',
  async () => {
    const departments = await dbOps.getAllDepartments();
    return departments;
  }
);

export const searchStaff = createAsyncThunk(
  'staff/search',
  async (query: string) => {
    const staff = await dbOps.searchStaffByName(query);
    return staff;
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearSelectedStaff: (state) => {
      state.selectedStaff = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setStaff: (state, action: PayloadAction<Staff[]>) => {
      state.staff = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all staff
      .addCase(fetchAllStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(fetchAllStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch staff';
      })
      // Fetch staff by ID
      .addCase(fetchStaffById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStaff = action.payload;
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch staff';
      })
      // Create staff
      .addCase(createNewStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff.unshift(action.payload);
      })
      .addCase(createNewStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create staff';
      })
      // Update staff
      .addCase(updateExistingStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingStaff.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.staff.findIndex(s => s.id === action.payload!.id);
          if (index !== -1) {
            state.staff[index] = action.payload;
          }
          if (state.selectedStaff?.id === action.payload.id) {
            state.selectedStaff = action.payload;
          }
        }
      })
      .addCase(updateExistingStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update staff';
      })
      // Deactivate staff
      .addCase(deactivateStaffMember.fulfilled, (state, action) => {
        const index = state.staff.findIndex(s => s.id === action.payload);
        if (index !== -1) {
          state.staff[index].isActive = false;
        }
      })
      // Reactivate staff
      .addCase(reactivateStaffMember.fulfilled, (state, action) => {
        const index = state.staff.findIndex(s => s.id === action.payload);
        if (index !== -1) {
          state.staff[index].isActive = true;
        }
      })
      // Toggle staff status
      .addCase(toggleStaffStatus.fulfilled, (state, action) => {
        const index = state.staff.findIndex(s => s.id === action.payload.staffId);
        if (index !== -1) {
          state.staff[index].isActive = action.payload.isActive;
        }
      })
      // Fetch staff count
      .addCase(fetchStaffCount.fulfilled, (state, action) => {
        state.staffCount = action.payload.total;
        state.activeStaffCount = action.payload.active;
      })
      // Fetch departments
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      })
      // Search staff
      .addCase(searchStaff.fulfilled, (state, action) => {
        state.staff = action.payload;
      });
  }
});

export const { clearSelectedStaff, clearError, setStaff } = staffSlice.actions;
export default staffSlice.reducer;
