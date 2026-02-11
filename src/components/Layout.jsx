import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { userData } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar untuk Desktop */}
      {!isMobile && <Sidebar />}
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sistem Informasi Sekolah
              </h1>
              {userData?.school_name && (
                <p className="text-sm text-gray-600 mt-1">
                  {userData.school_name}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {userData?.name || 'User'}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {userData?.role?.replace('_', ' ') || 'Role'}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary-600">
                  {userData?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation untuk Mobile */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;