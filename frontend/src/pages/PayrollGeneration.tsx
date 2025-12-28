import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAllStaff } from '../store/slices/staffSlice';
import { 
  generateMonthlyPayrolls, 
  fetchPayrollsByMonth,
  finalizePayrollRecord,
  createPayslipFromPayroll 
} from '../store/slices/payrollSlice';
import { showToast } from '../store/slices/uiSlice';
import { Card, Button, LoadingSpinner, Badge, Modal } from '../components/common';
import type { Staff, Payroll } from '../types';

const PayrollGeneration: React.FC = () => {
  const dispatch = useAppDispatch();
  const { staff } = useAppSelector((state) => state.staff);
  const { payrolls, loading, error } = useAppSelector((state) => state.payroll);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generating, setGenerating] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAllStaff());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPayrollsByMonth(selectedMonth));
  }, [dispatch, selectedMonth]);

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

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const handleGenerateAllPayrolls = async () => {
    setGenerating(true);
    
    try {
      await dispatch(generateMonthlyPayrolls(selectedMonth)).unwrap();
      dispatch(showToast({
        type: 'success',
        message: `Payrolls generated for ${formatMonth(selectedMonth)}`
      }));
      dispatch(fetchPayrollsByMonth(selectedMonth));
    } catch (error: any) {
      dispatch(showToast({
        type: 'error',
        message: error.message || 'Failed to generate payrolls'
      }));
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalizePayroll = async (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setShowConfirmModal(true);
  };

  const confirmFinalize = async () => {
    if (!selectedPayroll) return;

    try {
      await dispatch(finalizePayrollRecord(selectedPayroll.id)).unwrap();
      await dispatch(createPayslipFromPayroll(selectedPayroll.id)).unwrap();
      
      dispatch(showToast({
        type: 'success',
        message: 'Payroll finalized and payslip generated'
      }));
      dispatch(fetchPayrollsByMonth(selectedMonth));
    } catch (error: any) {
      dispatch(showToast({
        type: 'error',
        message: error.message || 'Failed to finalize payroll'
      }));
    } finally {
      setShowConfirmModal(false);
      setSelectedPayroll(null);
    }
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find((s: Staff) => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : staffId;
  };

  const getTotalPayroll = () => {
    return payrolls.reduce((sum: number, p: Payroll) => sum + p.grossPay, 0);
  };

  const getFinalizedCount = () => {
    return payrolls.filter((p: Payroll) => p.isFinalized).length;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Generation</h1>
          <p className="text-gray-600">Generate and manage monthly payrolls</p>
        </div>
      </div>

      {/* Month Selection and Actions */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={handleGenerateAllPayrolls}
            disabled={generating}
          >
            {generating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate All Payrolls
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Staff</p>
          <p className="text-2xl font-bold text-blue-600">{staff.filter((s: Staff) => s.isActive).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Payrolls Generated</p>
          <p className="text-2xl font-bold text-green-600">{payrolls.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Finalized</p>
          <p className="text-2xl font-bold text-purple-600">{getFinalizedCount()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Payroll</p>
          <p className="text-2xl font-bold text-orange-600">₦{getTotalPayroll().toLocaleString()}</p>
        </Card>
      </div>

      {/* Payroll Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : payrolls.length === 0 ? (
        <Card className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 mb-4">No payrolls generated for {formatMonth(selectedMonth)}</p>
          <Button onClick={handleGenerateAllPayrolls} disabled={generating}>
            Generate Payrolls
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours Worked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hourly Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrolls.map((payroll: Payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-blue-600">{payroll.staffId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {getStaffName(payroll.staffId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {payroll.totalHoursWorked.toFixed(2)} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      ₦{payroll.hourlyRate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      ₦{payroll.grossPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={payroll.isFinalized ? 'success' : 'warning'}>
                        {payroll.isFinalized ? 'Finalized' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {!payroll.isFinalized ? (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleFinalizePayroll(payroll)}
                        >
                          Finalize & Generate Payslip
                        </Button>
                      ) : (
                        <Badge variant="info">Completed</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirm Finalize Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Finalize Payroll"
      >
        {selectedPayroll && (
          <div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to finalize the payroll for{' '}
              <span className="font-medium">{getStaffName(selectedPayroll.staffId)}</span>?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Staff ID:</dt>
                  <dd className="font-mono">{selectedPayroll.staffId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Month:</dt>
                  <dd>{formatMonth(selectedPayroll.month)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Hours Worked:</dt>
                  <dd>{selectedPayroll.totalHoursWorked.toFixed(2)} hrs</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Gross Pay:</dt>
                  <dd className="font-bold text-green-600">₦{selectedPayroll.grossPay.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Once finalized, attendance records for this period cannot be modified. A payslip will be automatically generated.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={confirmFinalize}>
                Finalize & Generate Payslip
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PayrollGeneration;
