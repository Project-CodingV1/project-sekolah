import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id || !userData?.class_id) {
      setLoading(false);
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      
      // Calculate date range for selected month
      const startDate = startOfMonth(new Date(selectedMonth + '-01'));
      const endDate = endOfMonth(startDate);
      
      // Format dates for query
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      try {
        const attendanceData = await firestoreService.queryDocuments(
          'attendance',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'class_id', operator: '==', value: userData.class_id },
            { field: 'student_id', operator: '==', value: userData.id },
            { field: 'date', operator: '>=', value: startDateStr },
            { field: 'date', operator: '<=', value: endDateStr }
          ],
          'date'
        );

        setAttendance(attendanceData);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedMonth, userData?.school_id, userData?.id, userData?.class_id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'HADIR': return 'bg-green-100 text-green-800';
      case 'IZIN': return 'bg-blue-100 text-blue-800';
      case 'SAKIT': return 'bg-yellow-100 text-yellow-800';
      case 'ALFA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'HADIR': return 'Hadir';
      case 'IZIN': return 'Izin';
      case 'SAKIT': return 'Sakit';
      case 'ALFA': return 'Alfa';
      default: return status;
    }
  };

  // Calculate attendance statistics
  const stats = {
    total: attendance.length,
    hadir: attendance.filter(a => a.status === 'HADIR').length,
    izin: attendance.filter(a => a.status === 'IZIN').length,
    sakit: attendance.filter(a => a.status === 'SAKIT').length,
    alfa: attendance.filter(a => a.status === 'ALFA').length
  };

  const attendanceRate = stats.total > 0 
    ? ((stats.hadir + stats.izin) / stats.total * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Absensi</h2>
        <p className="text-gray-600 mt-1">Rekap kehadiran Anda</p>
      </div>

      {/* Month Filter */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Bulan
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Hari</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.hadir}
          </div>
          <div className="text-sm text-gray-600 mt-1">Hadir</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.izin}
          </div>
          <div className="text-sm text-gray-600 mt-1">Izin</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.sakit}
          </div>
          <div className="text-sm text-gray-600 mt-1">Sakit</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {stats.alfa}
          </div>
          <div className="text-sm text-gray-600 mt-1">Alfa</div>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Persentase Kehadiran</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {attendanceRate}%
            </span>
            <span className={`text-sm font-medium ${
              attendanceRate >= 90 ? 'text-green-600' :
              attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {attendanceRate >= 90 ? 'Sangat Baik' :
               attendanceRate >= 75 ? 'Baik' : 'Perlu Perbaikan'}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${
                attendanceRate >= 90 ? 'bg-green-600' :
                attendanceRate >= 75 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.min(attendanceRate, 100)}%` }}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            Catatan: Kehadiran = (Hadir + Izin) / Total Hari × 100%
          </div>
        </div>
      </div>

      {/* Attendance Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Detail Kehadiran</h3>
        
        {attendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hari
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dicatat Oleh
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'EEEE', { locale: id })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.recorded_by_name || 'Guru'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Tidak ada data absensi untuk bulan ini
          </div>
        )}
      </div>

      {/* Attendance Notes */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-gray-900 mb-2">Keterangan Status</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <strong>Hadir:</strong> Hadir mengikuti pelajaran
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            <strong>Izin:</strong> Tidak hadir dengan izin tertulis
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            <strong>Sakit:</strong> Tidak hadir karena sakit
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <strong>Alfa:</strong> Tidak hadir tanpa keterangan
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentAttendance;