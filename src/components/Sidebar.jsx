import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/authService';
import { 
  HiHome,
  HiAcademicCap,
  HiUserGroup,
  HiCalendar,
  HiClipboardCheck,
  HiCash,
  HiSpeakerphone,
  HiCog,
  HiEye,
  HiChartBar,
  HiLogout
} from 'react-icons/hi';

const Sidebar = () => {
  const { isSuperAdmin, isSchoolAdmin, isTeacher, isStudent, isParent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('Memulai proses logout...');
      const result = await logoutUser();
      
      if (result.success) {
        console.log('Logout berhasil, redirect ke login page');
        navigate('/login');
      } else {
        console.error('Logout gagal:', result.error);
        alert('Logout gagal: ' + result.error);
      }
    } catch (error) {
      console.error('Error saat logout:', error);
      alert('Terjadi kesalahan saat logout: ' + error.message);
    }
  };

  const superAdminMenu = [
    { path: '/superadmin/schools', label: 'Sekolah', icon: HiHome },
    { path: '/superadmin/packages', label: 'Paket', icon: HiAcademicCap },
    { path: '/superadmin/monitoring', label: 'Monitoring', icon: HiEye },
    { path: '/superadmin/settings', label: 'Setting', icon: HiCog },
  ];

  const schoolAdminMenu = [
    { path: '/admin/master', label: 'Master Data', icon: HiUserGroup },
    { path: '/admin/academic', label: 'Akademik', icon: HiAcademicCap },
    { path: '/admin/attendance', label: 'Absensi', icon: HiClipboardCheck },
    { path: '/admin/grades', label: 'Nilai', icon: HiChartBar },
    { path: '/admin/finance', label: 'Keuangan', icon: HiCash },
    { path: '/admin/announcements', label: 'Pengumuman', icon: HiSpeakerphone },
  ];

  const teacherMenu = [
    { path: '/guru/classes', label: 'Kelas', icon: HiUserGroup },
    { path: '/guru/attendance', label: 'Absensi', icon: HiClipboardCheck },
    { path: '/guru/grades', label: 'Nilai', icon: HiChartBar },
    { path: '/guru/schedule', label: 'Jadwal', icon: HiCalendar },
  ];

  const studentMenu = [
    { path: '/murid/classes', label: 'Kelas', icon: HiUserGroup },
    { path: '/murid/schedule', label: 'Jadwal', icon: HiCalendar },
    { path: '/murid/grades', label: 'Nilai', icon: HiChartBar },
    { path: '/murid/attendance', label: 'Absensi', icon: HiClipboardCheck },
    { path: '/murid/payments', label: 'Pembayaran', icon: HiCash },
  ];

  const parentMenu = [
    { path: '/orangtua/children', label: 'Anak', icon: HiUserGroup },
    { path: '/orangtua/attendance', label: 'Absensi', icon: HiClipboardCheck },
    { path: '/orangtua/grades', label: 'Nilai', icon: HiChartBar },
    { path: '/orangtua/announcements', label: 'Pengumuman', icon: HiSpeakerphone },
    { path: '/orangtua/payments', label: 'Pembayaran', icon: HiCash },
  ];

  const getMenuItems = () => {
    if (isSuperAdmin) return superAdminMenu;
    if (isSchoolAdmin) return schoolAdminMenu;
    if (isTeacher) return teacherMenu;
    if (isStudent) return studentMenu;
    if (isParent) return parentMenu;
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-primary-700">SekolahApp</h2>
        <p className="text-sm text-gray-600 mt-1">Multi-School Platform</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
        >
          <HiLogout className="w-5 h-5" />
          <span className="font-medium">Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;