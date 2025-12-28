import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchPayslipsByMonth } from '../store/slices/payrollSlice';
import { fetchAllStaff } from '../store/slices/staffSlice';
import { showToast } from '../store/slices/uiSlice';
import { Card, Button, LoadingSpinner, Badge, Modal } from '../components/common';
import type { Payslip } from '../types';
import { generatePayslipPDF } from '../services/payslip.generator';

const PayslipViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { payslips, loading } = useAppSelector((state) => state.payroll);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAllStaff());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPayslipsByMonth(selectedMonth));
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

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setShowPreviewModal(true);
  };

  const handleDownloadPayslip = (payslip: Payslip) => {
    try {
      generatePayslipPDF(payslip);
      dispatch(showToast({
        type: 'success',
        message: 'Payslip downloaded successfully'
      }));
    } catch (error) {
      dispatch(showToast({
        type: 'error',
        message: 'Failed to download payslip'
      }));
    }
  };

  const handleDownloadAll = () => {
    if (payslips.length === 0) {
      dispatch(showToast({
        type: 'warning',
        message: 'No payslips to download'
      }));
      return;
    }

    payslips.forEach((payslip: Payslip) => {
      setTimeout(() => {
        generatePayslipPDF(payslip);
      }, 500);
    });

    dispatch(showToast({
      type: 'success',
      message: `Downloading ${payslips.length} payslips...`
    }));
  };

  const getTotalDisbursed = () => {
    return payslips.reduce((sum: number, p: Payslip) => sum + p.grossPay, 0);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payslip Viewer</h1>
          <p className="text-gray-600">View and download generated payslips</p>
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
            onClick={handleDownloadAll}
            disabled={payslips.length === 0}
            variant="secondary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All Payslips
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Payslips Generated</p>
          <p className="text-2xl font-bold text-blue-600">{payslips.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Month</p>
          <p className="text-2xl font-bold text-purple-600">{formatMonth(selectedMonth)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Disbursed</p>
          <p className="text-2xl font-bold text-green-600">₦{getTotalDisbursed().toLocaleString()}</p>
        </Card>
      </div>

      {/* Payslips Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : payslips.length === 0 ? (
        <Card className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No payslips found for {formatMonth(selectedMonth)}</p>
          <p className="text-sm text-gray-400 mt-2">
            Generate payrolls and finalize them to create payslips
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map((payslip: Payslip) => (
            <Card key={payslip.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{payslip.staffName}</h3>
                  <p className="text-sm text-gray-500 font-mono">{payslip.staffId}</p>
                </div>
                <Badge variant="success">Paid</Badge>
              </div>

              <dl className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Department</dt>
                  <dd className="text-gray-900">{payslip.department}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Hours Worked</dt>
                  <dd className="text-gray-900">{payslip.totalHours.toFixed(2)} hrs</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Hourly Rate</dt>
                  <dd className="text-gray-900">₦{payslip.hourlyRate.toLocaleString()}</dd>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <dt className="font-medium text-gray-700">Gross Pay</dt>
                  <dd className="font-bold text-green-600">₦{payslip.grossPay.toLocaleString()}</dd>
                </div>
              </dl>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewPayslip(payslip)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownloadPayslip(payslip)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payslip Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Payslip Preview"
        size="lg"
      >
        {selectedPayslip && (
          <div>
            {/* Payslip Header */}
            <div className="bg-blue-600 text-white p-6 rounded-t-lg -mx-6 -mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-12 w-12 rounded-full bg-white p-1"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{selectedPayslip.employer}</h2>
                    <p className="text-blue-100 text-sm">Official Payslip</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Pay Period</p>
                  <p className="font-semibold">{formatMonth(selectedPayslip.month)}</p>
                </div>
              </div>
            </div>

            {/* Employee Details */}
            <div className="p-6 border-b">
              <h3 className="text-sm font-medium text-gray-500 mb-3">EMPLOYEE INFORMATION</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee Name</p>
                  <p className="font-medium">{selectedPayslip.staffName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-mono">{selectedPayslip.staffId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{selectedPayslip.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">{selectedPayslip.role}</p>
                </div>
              </div>
            </div>

            {/* Earnings */}
            <div className="p-6 border-b">
              <h3 className="text-sm font-medium text-gray-500 mb-3">EARNINGS SUMMARY</h3>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Hours/Rate</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  <tr>
                    <td className="py-2">Total Hours Worked</td>
                    <td className="py-2 text-center">{selectedPayslip.totalHours.toFixed(2)} hrs</td>
                    <td className="py-2 text-right">-</td>
                  </tr>
                  <tr>
                    <td className="py-2">Hourly Rate</td>
                    <td className="py-2 text-center">-</td>
                    <td className="py-2 text-right">₦{selectedPayslip.hourlyRate.toLocaleString()}</td>
                  </tr>
                  <tr className="border-t font-semibold">
                    <td className="pt-4">Gross Pay</td>
                    <td className="pt-4 text-center">-</td>
                    <td className="pt-4 text-right text-green-600">
                      ₦{selectedPayslip.grossPay.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 rounded-b-lg -mx-6 -mb-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Generated: {new Date(selectedPayslip.generatedAt).toLocaleDateString()}
                </p>
                <Button onClick={() => handleDownloadPayslip(selectedPayslip)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PayslipViewer;
