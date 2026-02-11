import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id) return;

    // Fetch classes
    const fetchClasses = async () => {
      const classesData = await firestoreService.queryDocuments(
        'classes',
        [
          { field: 'school_id', operator: '==', value: userData.school_id }
        ],
        'grade_level'
      );
      setClasses(classesData);
      if (classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
    };

    fetchClasses();
  }, [userData?.school_id]);

  useEffect(() => {
    if (!selectedClass || !userData?.school_id) return;

    const fetchAttendance = async () => {
      setLoading(true);
      
      // Calculate date range for selected month
      const startDate = startOfMonth(new Date(selectedMonth + '-01'));
      const endDate = endOfMonth(startDate);
      
      // Format dates for query
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      try {
        // Get attendance for selected class and month
        const attendance = await firestoreService.queryDocuments(
          'attendance',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'class_id', operator: '==', value: selectedClass },
            { field: 'date', operator: '>=', value: startDateStr },
            { field: 'date', operator: '<=', value: endDateStr }
          ]
        );
        
        // Get students in class
        const students = await firestoreService.queryDocuments(
          'users',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'class_id', operator: '==', value: selectedClass },
            { field: 'role', operator: '==', value: 'student' }
          ],
          'name'
        );
        
        // Process data
        const processedData = students.map(student => {
          const studentAttendance = attendance.filter(a => a.student_id === student.id);
          
          const stats = {
            hadir: studentAttendance.filter(a => a.status === 'HADIR').length,
            izin: studentAttendance.filter(a => a.status === 'IZIN').length,
            sakit: studentAttendance.filter(a => a.status === 'SAKIT').length,
            alfa: studentAttendance.filter(a => a.status === 'ALFA').length
          };
          
          const totalDays = studentAttendance.length;
          const attendanceRate = totalDays > 0 ? ((stats.hadir + stats.izin) / totalDays * 100).toFixed(1) : 0;
          
          return {
            ...student,
            stats,
            totalDays,
            attendanceRate
          };
        });
        
        setAttendanceData(processedData);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedClass, selectedMonth, userData?.school_id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'HADIR': return 'bg-green-100 text-green-800';
      case 'IZIN': return 'bg-blue-100 text-blue-800';
      case 'SAKIT': return 'bg-yellow-100 text-yellow-800';
      case 'ALFA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && attendanceData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rekap Absensi</h2>
        <p className="text-gray-600 mt-1">Monitoring kehadiran siswa</p>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pilih Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field"
            disabled={classes.length === 0}
          >
            {classes.length === 0 ? (
              <option value="">Tidak ada kelas</option>
            ) : (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.grade_level}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bulan
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {attendanceData.reduce((sum, student) => sum + student.stats.hadir, 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Hadir</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {attendanceData.reduce((sum, student) => sum + student.stats.izin, 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Izin</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {attendanceData.reduce((sum, student) => sum + student.stats.sakit, 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Sakit</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {attendanceData.reduce((sum, student) => sum + student.stats.alfa, 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Alfa</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hadir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Izin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sakit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alfa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persentase
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.nis || '-'}
                    </div>
                  </td>
                  
                  {['hadir', 'izin', 'sakit', 'alfa'].map((status) => (
                    <td key={status} className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.toUpperCase())}`}>
                        {student.stats[status]}
                      </span>
                    </td>
                  ))}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.totalDays} hari
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            student.attendanceRate >= 90 ? 'bg-green-600' :
                            student.attendanceRate >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(student.attendanceRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {student.attendanceRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {attendanceData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data absensi untuk bulan ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;