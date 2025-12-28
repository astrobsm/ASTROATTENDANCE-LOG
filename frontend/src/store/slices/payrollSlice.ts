import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Payroll, Payslip, PayrollSummary } from '../../types';
import * as dbOps from '../../database';

interface PayrollState {
  payrolls: Payroll[];
  payslips: Payslip[];
  selectedPayroll: Payroll | null;
  selectedPayslip: Payslip | null;
  summary: PayrollSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: PayrollState = {
  payrolls: [],
  payslips: [],
  selectedPayroll: null,
  selectedPayslip: null,
  summary: null,
  loading: false,
  error: null
};

// Async thunks
export const generateStaffPayroll = createAsyncThunk(
  'payroll/generateForStaff',
  async ({ staffId, month }: { staffId: string; month: string }) => {
    const payroll = await dbOps.generatePayroll(staffId, month);
    return payroll;
  }
);

export const generateMonthlyPayrolls = createAsyncThunk(
  'payroll/generateMonthly',
  async (month: string) => {
    const payrolls = await dbOps.generateBulkPayroll(month);
    return payrolls;
  }
);

export const generateAllPayrolls = createAsyncThunk(
  'payroll/generateAll',
  async (month: string) => {
    const payrolls = await dbOps.generateBulkPayroll(month);
    return payrolls;
  }
);

export const fetchPayrollById = createAsyncThunk(
  'payroll/fetchById',
  async (id: string) => {
    const payroll = await dbOps.getPayrollById(id);
    if (!payroll) {
      throw new Error(`Payroll with ID ${id} not found`);
    }
    return payroll;
  }
);

export const fetchStaffPayrolls = createAsyncThunk(
  'payroll/fetchByStaff',
  async (staffId: string) => {
    const payrolls = await dbOps.getPayrollsByStaff(staffId);
    return payrolls;
  }
);

export const fetchPayrollsByMonth = createAsyncThunk(
  'payroll/fetchPayrollsByMonth',
  async (month: string) => {
    const payrolls = await dbOps.getPayrollsByMonth(month);
    return payrolls;
  }
);

export const fetchMonthlyPayrolls = createAsyncThunk(
  'payroll/fetchByMonth',
  async (month: string) => {
    const payrolls = await dbOps.getPayrollsByMonth(month);
    return payrolls;
  }
);

export const finalizePayrollRecord = createAsyncThunk(
  'payroll/finalizeRecord',
  async (payrollId: string) => {
    const payroll = await dbOps.finalizePayroll(payrollId);
    return payroll;
  }
);

export const finalizeStaffPayroll = createAsyncThunk(
  'payroll/finalize',
  async (payrollId: string) => {
    const payroll = await dbOps.finalizePayroll(payrollId);
    return payroll;
  }
);

export const createPayslipFromPayroll = createAsyncThunk(
  'payroll/createPayslip',
  async (payrollId: string) => {
    const payslip = await dbOps.generatePayslip(payrollId);
    return payslip;
  }
);

export const generateStaffPayslip = createAsyncThunk(
  'payroll/generatePayslip',
  async (payrollId: string) => {
    const payslip = await dbOps.generatePayslip(payrollId);
    return payslip;
  }
);

export const fetchPayslipById = createAsyncThunk(
  'payroll/fetchPayslipById',
  async (id: string) => {
    const payslip = await dbOps.getPayslipById(id);
    if (!payslip) {
      throw new Error(`Payslip with ID ${id} not found`);
    }
    return payslip;
  }
);

export const fetchStaffPayslips = createAsyncThunk(
  'payroll/fetchPayslipsByStaff',
  async (staffId: string) => {
    const payslips = await dbOps.getPayslipsByStaff(staffId);
    return payslips;
  }
);

export const fetchMonthlyPayslips = createAsyncThunk(
  'payroll/fetchPayslipsByMonth',
  async (month: string) => {
    const payslips = await dbOps.getPayslipsByMonth(month);
    return payslips;
  }
);

export const fetchPayslipsByMonth = createAsyncThunk(
  'payroll/fetchPayslipsForMonth',
  async (month: string) => {
    const payslips = await dbOps.getPayslipsByMonth(month);
    return payslips;
  }
);

export const fetchAllPayslips = createAsyncThunk(
  'payroll/fetchAllPayslips',
  async () => {
    // Get payslips for current month as default
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const payslips = await dbOps.getPayslipsByMonth(month);
    return payslips;
  }
);

export const fetchPayrollSummary = createAsyncThunk(
  'payroll/fetchSummary',
  async (month: string) => {
    const summary = await dbOps.getPayrollSummary(month);
    return summary;
  }
);

export const removePayroll = createAsyncThunk(
  'payroll/delete',
  async (payrollId: string) => {
    await dbOps.deletePayroll(payrollId);
    return payrollId;
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearSelectedPayroll: (state) => {
      state.selectedPayroll = null;
    },
    clearSelectedPayslip: (state) => {
      state.selectedPayslip = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPayrolls: (state, action: PayloadAction<Payroll[]>) => {
      state.payrolls = action.payload;
    },
    setPayslips: (state, action: PayloadAction<Payslip[]>) => {
      state.payslips = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate staff payroll
      .addCase(generateStaffPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateStaffPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls.unshift(action.payload);
      })
      .addCase(generateStaffPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate payroll';
      })
      // Generate all payrolls
      .addCase(generateAllPayrolls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateAllPayrolls.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls = [...action.payload, ...state.payrolls];
      })
      .addCase(generateAllPayrolls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate payrolls';
      })
      // Fetch payroll by ID
      .addCase(fetchPayrollById.fulfilled, (state, action) => {
        state.selectedPayroll = action.payload;
      })
      // Fetch staff payrolls
      .addCase(fetchStaffPayrolls.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStaffPayrolls.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls = action.payload;
      })
      // Fetch monthly payrolls
      .addCase(fetchMonthlyPayrolls.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMonthlyPayrolls.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls = action.payload;
      })
      // Finalize payroll
      .addCase(finalizeStaffPayroll.fulfilled, (state, action) => {
        const index = state.payrolls.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.payrolls[index] = action.payload;
        }
        if (state.selectedPayroll?.id === action.payload.id) {
          state.selectedPayroll = action.payload;
        }
      })
      // Generate payslip
      .addCase(generateStaffPayslip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateStaffPayslip.fulfilled, (state, action) => {
        state.loading = false;
        state.payslips.unshift(action.payload);
        state.selectedPayslip = action.payload;
      })
      .addCase(generateStaffPayslip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate payslip';
      })
      // Fetch payslip by ID
      .addCase(fetchPayslipById.fulfilled, (state, action) => {
        state.selectedPayslip = action.payload;
      })
      // Fetch staff payslips
      .addCase(fetchStaffPayslips.fulfilled, (state, action) => {
        state.payslips = action.payload;
      })
      // Fetch monthly payslips
      .addCase(fetchMonthlyPayslips.fulfilled, (state, action) => {
        state.payslips = action.payload;
      })
      // Fetch payslips by month
      .addCase(fetchPayslipsByMonth.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayslipsByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.payslips = action.payload;
      })
      // Fetch payrolls by month
      .addCase(fetchPayrollsByMonth.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayrollsByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls = action.payload;
      })
      // Generate monthly payrolls
      .addCase(generateMonthlyPayrolls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateMonthlyPayrolls.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls = action.payload;
      })
      .addCase(generateMonthlyPayrolls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate payrolls';
      })
      // Finalize payroll record
      .addCase(finalizePayrollRecord.fulfilled, (state, action) => {
        const index = state.payrolls.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.payrolls[index] = action.payload;
        }
      })
      // Create payslip from payroll
      .addCase(createPayslipFromPayroll.fulfilled, (state, action) => {
        state.payslips.unshift(action.payload);
      })
      // Fetch summary
      .addCase(fetchPayrollSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      // Delete payroll
      .addCase(removePayroll.fulfilled, (state, action) => {
        state.payrolls = state.payrolls.filter(p => p.id !== action.payload);
      });
  }
});

export const {
  clearSelectedPayroll,
  clearSelectedPayslip,
  clearError,
  setPayrolls,
  setPayslips
} = payrollSlice.actions;

export default payrollSlice.reducer;
