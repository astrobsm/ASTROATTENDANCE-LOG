import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createNewStaff } from '../store/slices/staffSlice';
import { showToast } from '../store/slices/uiSlice';
import { Card, Button, Input, Select, LoadingSpinner } from '../components/common';
import { fingerprintService } from '../services';
import { APP_CONSTANTS } from '../types';

interface StaffFormData {
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  hourlyRate: number;
}

const departments = [
  'Administration',
  'Engineering',
  'Human Resources',
  'Finance',
  'Operations',
  'Sales',
  'Marketing',
  'IT Support',
  'Customer Service'
];

const roles = [
  'Manager',
  'Supervisor',
  'Team Lead',
  'Senior Staff',
  'Staff',
  'Junior Staff',
  'Intern',
  'Contractor'
];

const StaffRegistration: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.staff);

  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    department: '',
    role: '',
    hourlyRate: APP_CONSTANTS.DEFAULT_HOURLY_RATE
  });

  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  const [enrollingFingerprint, setEnrollingFingerprint] = useState(false);
  const [step, setStep] = useState<'details' | 'fingerprint' | 'complete'>('details');
  const [generatedStaffId, setGeneratedStaffId] = useState<string | null>(null);

  // Generate a unique staff ID based on name and timestamp
  const generateStaffId = () => {
    const prefix = 'ASTRO-EMP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
    return `${prefix}-${initials}-${timestamp}`;
  };

  const handleInputChange = (field: keyof StaffFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.department || !formData.role) {
      dispatch(showToast({ type: 'error', message: 'Please fill in all required fields' }));
      return;
    }

    // Generate staff ID for fingerprint enrollment
    const staffId = generateStaffId();
    setGeneratedStaffId(staffId);
    setStep('fingerprint');
  };

  const handleEnrollFingerprint = async () => {
    if (!generatedStaffId) {
      dispatch(showToast({ type: 'error', message: 'Staff ID not generated. Please go back and try again.' }));
      return;
    }

    setEnrollingFingerprint(true);
    
    try {
      const result = await fingerprintService.enrollFingerprint(generatedStaffId);
      
      if (result.success && result.templateId) {
        setFingerprintId(result.templateId);
        dispatch(showToast({ type: 'success', message: 'Fingerprint enrolled successfully!' }));
        setStep('complete');
      } else {
        dispatch(showToast({ type: 'error', message: result.error || 'Failed to enroll fingerprint' }));
      }
    } catch (error) {
      dispatch(showToast({ 
        type: 'error', 
        message: 'Fingerprint service unavailable. Please ensure the local service is running.' 
      }));
    } finally {
      setEnrollingFingerprint(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!fingerprintId || !generatedStaffId) {
      dispatch(showToast({ type: 'error', message: 'Fingerprint enrollment required' }));
      return;
    }

    try {
      await dispatch(createNewStaff({
        ...formData,
        staffId: generatedStaffId,
        fingerprintTemplateId: fingerprintId
      })).unwrap();

      dispatch(showToast({ type: 'success', message: 'Staff registered successfully!' }));
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        department: '',
        role: '',
        hourlyRate: APP_CONSTANTS.DEFAULT_HOURLY_RATE
      });
      setFingerprintId(null);
      setGeneratedStaffId(null);
      setStep('details');
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.message || 'Failed to register staff' }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Registration</h1>
        <p className="text-gray-600">Register a new staff member with fingerprint enrollment</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Details', 'Fingerprint', 'Complete'].map((label, index) => {
            const stepNum = index + 1;
            const currentStep = step === 'details' ? 1 : step === 'fingerprint' ? 2 : 3;
            const isActive = stepNum === currentStep;
            const isComplete = stepNum < currentStep;

            return (
              <React.Fragment key={label}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isComplete
                        ? 'bg-green-600 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`ml-2 font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-4 ${isComplete ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <Card className="p-6">
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select
                label="Department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                options={[
                  { value: '', label: 'Select department' },
                  ...departments.map((d) => ({ value: d, label: d }))
                ]}
                required
              />
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                options={[
                  { value: '', label: 'Select role' },
                  ...roles.map((r) => ({ value: r, label: r }))
                ]}
                required
              />
            </div>

            <div className="mt-4">
              <Input
                label="Hourly Rate (₦)"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value))}
                min={0}
                step={0.01}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Default rate: ₦{APP_CONSTANTS.DEFAULT_HOURLY_RATE}/hour
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <Button type="submit">
                Continue to Fingerprint
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </form>
        )}

        {step === 'fingerprint' && (
          <div className="text-center py-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Fingerprint Enrollment</h2>
            <p className="text-gray-600 mb-8">
              Registering: {formData.firstName} {formData.lastName}
            </p>

            <div className="mb-8">
              <svg
                className={`w-32 h-32 mx-auto ${enrollingFingerprint ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                />
              </svg>
            </div>

            {fingerprintId ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 font-medium">Fingerprint enrolled successfully!</p>
              </div>
            ) : enrollingFingerprint ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <svg className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
                <p className="text-blue-700 font-bold text-lg">PLACE YOUR FINGER ON THE SCANNER NOW!</p>
                <p className="text-blue-600 text-sm mt-1">Keep your finger still until all 4 scans complete</p>
              </div>
            ) : (
              <p className="text-gray-500 mb-6">
                Click the button below and <strong>immediately place your finger on the scanner</strong>
              </p>
            )}

            <div className="flex justify-center space-x-4">
              <Button variant="secondary" onClick={() => setStep('details')}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              
              {!fingerprintId ? (
                <Button onClick={handleEnrollFingerprint} disabled={enrollingFingerprint}>
                  {enrollingFingerprint ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Scanning...
                    </>
                  ) : (
                    'Enroll Fingerprint'
                  )}
                </Button>
              ) : (
                <Button onClick={() => setStep('complete')}>
                  Continue
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Complete</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
              <h3 className="font-medium text-gray-900 mb-4">Staff Details</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name:</dt>
                  <dd className="font-medium">{formData.firstName} {formData.lastName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Department:</dt>
                  <dd className="font-medium">{formData.department}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Role:</dt>
                  <dd className="font-medium">{formData.role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Hourly Rate:</dt>
                  <dd className="font-medium">₦{formData.hourlyRate.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Fingerprint:</dt>
                  <dd className="font-medium text-green-600">✓ Enrolled</dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="secondary" onClick={() => setStep('fingerprint')}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <Button onClick={handleCreateStaff} disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete Registration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StaffRegistration;
