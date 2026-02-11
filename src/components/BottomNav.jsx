import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiHome,
  HiAcademicCap,
  HiUserGroup,
  HiCalendar,
  HiClipboardCheck,
  HiCash,
  HiSpeakerphone,
  HiCog
} from 'react-icons/hi';

const BottomNav = () => {
  const { isSuperAdmin, isSchoolAdmin, isTeacher, isStudent, isParent } = useAuth();

  const getMenuItems = () => {
    if (isSuperAdmin) {
      return [
        { path: '/superadmin/schools', label: 'Sekolah', icon: HiHome },
        { path: '/superadmin/packages', label: 'Paket', icon: HiAcademicCap },
        { path: '/superadmin/monitoring', label: 'Monitor', icon: HiCog },
        { path: '/superadmin/settings', label: 'Setting', icon: HiCog },
      ];
    }
    if (isSchoolAdmin) {
      return [
        { path: '/admin/master', label: 'Master', icon: HiUserGroup },
        { path: '/admin/academic', label: 'Akademik', icon: HiAcademicCap },
        { path: '/admin/finance', label: 'Keuangan', icon: HiCash },
        { path: '/admin/announcements', label: 'Info', icon: HiSpeakerphone },
      ];
    }
    if (isTeacher) {
      return [
        { path: '/guru/classes', label: 'Kelas', icon: HiUserGroup },
        { path: '/guru/attendance', label: 'Absen', icon: HiClipboardCheck },
        { path: '/guru/grades', label: 'Nilai', icon: HiAcademicCap },
        { path: '/guru/schedule', label: 'Jadwal', icon: HiCalendar },
      ];
    }
    if (isStudent) {
      return [
        { path: '/murid/classes', label: 'Kelas', icon: HiUserGroup },
        { path: '/murid/schedule', label: 'Jadwal', icon: HiCalendar },
        { path: '/murid/grades', label: 'Nilai', icon: HiAcademicCap },
        { path: '/murid/payments', label: 'Bayar', icon: HiCash },
      ];
    }
    if (isParent) {
      return [
        { path: '/orangtua/children', label: 'Anak', icon: HiUserGroup },
        { path: '/orangtua/attendance', label: 'Absen', icon: HiClipboardCheck },
        { path: '/orangtua/grades', label: 'Nilai', icon: HiAcademicCap },
        { path: '/orangtua/payments', label: 'Bayar', icon: HiCash },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 md:hidden">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 ${
                isActive ? 'text-primary-600' : 'text-gray-600'
              }`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;