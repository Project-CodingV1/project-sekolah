import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';

// Auth Pages
import Login from '../pages/auth/Login';

// Super Admin Pages
import Schools from '../pages/superadmin/Schools';
import Packages from '../pages/superadmin/Packages';
import Monitoring from '../pages/superadmin/Monitoring';
import Settings from '../pages/superadmin/Settings';

// School Admin Pages
import Master from '../pages/admin/Master';
import Academic from '../pages/admin/Academic';
import Attendance from '../pages/admin/Attendance';
import Grades from '../pages/admin/Grades';
import Finance from '../pages/admin/Finance';
import Announcements from '../pages/admin/Announcements';

// Teacher Pages
import TeacherClasses from '../pages/guru/TeacherClasses';
import TeacherAttendance from '../pages/guru/TeacherAttendance';
import TeacherGrades from '../pages/guru/TeacherGrades';
import TeacherSchedule from '../pages/guru/TeacherSchedule';

// Student Pages
import StudentClasses from '../pages/murid/StudentClasses';
import StudentSchedule from '../pages/murid/StudentSchedule';
import StudentGrades from '../pages/murid/StudentGrades';
import StudentAttendance from '../pages/murid/StudentAttendance';
import StudentPayments from '../pages/murid/StudentPayments';

// Parent Pages
import ParentChildren from '../pages/orangtua/ParentChildren';
import ParentAttendance from '../pages/orangtua/ParentAttendance';
import ParentGrades from '../pages/orangtua/ParentGrades';
import ParentAnnouncements from '../pages/orangtua/ParentAnnouncements';
import ParentPayments from '../pages/orangtua/ParentPayments';

const AppRoutes = () => {
  const { isAuthenticated, userData } = useAuth();

  const getDefaultRoute = () => {
    if (!isAuthenticated || !userData) return '/login';
    
    switch (userData.role) {
      case 'super_admin':
        return '/superadmin/schools';
      case 'school_admin':
        return '/admin/master';
      case 'teacher':
        return '/guru/classes';
      case 'student':
        return '/murid/classes';
      case 'parent':
        return '/orangtua/children';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <Login />
      } />
      
      {/* Super Admin Routes */}
      <Route path="/superadmin" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="schools" />} />
        <Route path="schools" element={<Schools />} />
        <Route path="packages" element={<Packages />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* School Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['school_admin']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="master" />} />
        <Route path="master" element={<Master />} />
        <Route path="academic" element={<Academic />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="grades" element={<Grades />} />
        <Route path="finance" element={<Finance />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>
      
      {/* Teacher Routes */}
      <Route path="/guru" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="classes" />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="grades" element={<TeacherGrades />} />
        <Route path="schedule" element={<TeacherSchedule />} />
      </Route>
      
      {/* Student Routes */}
      <Route path="/murid" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="classes" />} />
        <Route path="classes" element={<StudentClasses />} />
        <Route path="schedule" element={<StudentSchedule />} />
        <Route path="grades" element={<StudentGrades />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="payments" element={<StudentPayments />} />
      </Route>
      
      {/* Parent Routes */}
      <Route path="/orangtua" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="children" />} />
        <Route path="children" element={<ParentChildren />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="grades" element={<ParentGrades />} />
        <Route path="announcements" element={<ParentAnnouncements />} />
        <Route path="payments" element={<ParentPayments />} />
      </Route>
      
      {/* Catch all - redirect to default */}
      <Route path="*" element={
        <Navigate to={getDefaultRoute()} />
      } />
    </Routes>
  );
};

export default AppRoutes;