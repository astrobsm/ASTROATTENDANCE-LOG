import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { staffName, role } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Current date */}
        <div className="hidden sm:block">
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {role === 'admin' ? 'Administrator' : 'Staff'}
        </span>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {staffName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">{staffName || 'User'}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};
