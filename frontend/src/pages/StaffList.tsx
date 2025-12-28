import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAllStaff, toggleStaffStatus } from '../store/slices/staffSlice';
import { showToast } from '../store/slices/uiSlice';
import { Card, Button, Input, Badge, LoadingSpinner, Modal } from '../components/common';
import { Staff } from '../types';

const StaffList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { staff, loading, error } = useAppSelector((state) => state.staff);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAllStaff());
  }, [dispatch]);

  const filteredStaff = staff.filter((s: Staff) => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !filterDepartment || s.department === filterDepartment;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && s.isActive) ||
      (filterStatus === 'inactive' && !s.isActive);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(staff.map((s: Staff) => s.department))];

  const handleToggleStatus = async (staffMember: Staff) => {
    try {
      await dispatch(toggleStaffStatus({ 
        staffId: staffMember.id, 
        isActive: !staffMember.isActive 
      })).unwrap();
      
      dispatch(showToast({
        type: 'success',
        message: `Staff ${staffMember.isActive ? 'deactivated' : 'activated'} successfully`
      }));
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.message }));
    }
  };

  const handleViewDetails = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowDetailsModal(true);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff List</h1>
          <p className="text-gray-600">Manage all registered staff members</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Badge variant="info" className="text-sm">
            {filteredStaff.length} of {staff.length} staff members
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </Card>

      {/* Staff Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600">{error}</p>
        </Card>
      ) : filteredStaff.length === 0 ? (
        <Card className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500">No staff members found</p>
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
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hourly Rate
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
                {filteredStaff.map((staffMember: Staff) => (
                  <tr key={staffMember.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-blue-600">{staffMember.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {staffMember.firstName[0]}{staffMember.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {staffMember.firstName} {staffMember.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {staffMember.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {staffMember.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      ₦{staffMember.hourlyRate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={staffMember.isActive ? 'success' : 'error'}>
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(staffMember)}
                        >
                          View
                        </Button>
                        <Button
                          variant={staffMember.isActive ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => handleToggleStatus(staffMember)}
                        >
                          {staffMember.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Staff Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Staff Details"
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl text-blue-600 font-medium">
                  {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                </span>
              </div>
            </div>

            <dl className="divide-y divide-gray-200">
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Staff ID</dt>
                <dd className="font-mono text-blue-600">{selectedStaff.id}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Full Name</dt>
                <dd className="font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Department</dt>
                <dd>{selectedStaff.department}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd>{selectedStaff.role}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Hourly Rate</dt>
                <dd>₦{selectedStaff.hourlyRate.toLocaleString()}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <Badge variant={selectedStaff.isActive ? 'success' : 'error'}>
                    {selectedStaff.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Registered</dt>
                <dd>{new Date(selectedStaff.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-gray-500">Fingerprint</dt>
                <dd>
                  <Badge variant="success">Enrolled</Badge>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffList;
