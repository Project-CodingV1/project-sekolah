import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const ParentAttendance = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id) {
      setLoading(false);
      return;
    }

    fetchChildren();
  }, [userData?.school_id, userData?.id]);

  useEffect(() => {
    if (selectedChild) {
      fetchAttendance();
    }
  }, [selectedChild, selectedMonth]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Untuk orang tua, ambil anak-anak berdasarkan parent_id
      const childrenData = await firestoreService.queryDocuments(
        'users',
        [
          { field: 'school_id', operator: '==', value: userData.school_id },
          { field: 'parent_id', operator: '==', value: userData.id },
          { field: 'role', operator: '==', value: 'student' },
          { field: 'status', operator: '==', value: 'active' }
        ],
        'name'
      );

      console.log('Children loaded:', childrenData.length);
      setChildren(childrenData);
      
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Gagal memuat data anak');
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedChild) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Calculate date range for selected month
      const startDate = startOfMonth(new Date(selectedMonth + '-01'));
      const endDate = endOfMonth(startDate);
      
      // Format dates for query
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const attendanceData = await firestoreService.queryDocuments(
        'attendance',
        [
          { field: 'school_id', operator: '==', value: userData.school_id },
          { field: 'student_id', operator: '==', value: selectedChild },
          { field: 'date', operator: '>=', value: startDateStr },
          { field: 'date', operator: '<=', value: endDateStr }
        ],
        'date'
      );

      console.log('Attendance loaded:', attendanceData.length);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedChild = () => {
    return children.find(child => child.id === selectedChild);
  };

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

  const selectedChildData = getSelectedChild();

  if (loading && children.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Absensi Anak</h2>
        <p className="text-gray-600 mt-1">Pantau kehadiran anak di sekolah</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {children.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75a3.75 3.75 0 01-7.5 0m7.5 0a3.75 3.75 0 00-7.5 0" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada anak terdaftar
          </h3>
          <p className="text-gray-600">
            Hubungi admin sekolah untuk menambahkan data anak
          </p>
        </div>
      ) : (
        <>
          {/* Child Selection and Filters */}
          <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Anak
              </label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="input-field"
                disabled={loading}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} - {child.nis || 'No NIS'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Bulan
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          {/* Child Info */}
          {selectedChildData && (
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600">
                      {selectedChildData.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedChildData.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      NIS: {selectedChildData.nis || '-'} | Kelas: {selectedChildData.class_name || '-'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {attendanceRate}%
                  </div>
                  <div className="text-sm text-gray-600">Kehadiran</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && selectedChild && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Memuat data absensi...</span>
            </div>
          )}

          {/* Attendance Stats */}
          {!loading && selectedChild && (
            <>
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

              {/* Attendance Rate Chart */}
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
                        {attendance.map((record) => {
                          // Pastikan date adalah string yang valid
                          let dateObj;
                          try {
                            if (record.date && typeof record.date === 'string') {
                              dateObj = new Date(record.date);
                            } else if (record.date && record.date.toDate) {
                              dateObj = record.date.toDate();
                            } else {
                              dateObj = new Date();
                            }
                          } catch (e) {
                            dateObj = new Date();
                          }
                          
                          return (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(dateObj, 'dd/MM/yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(dateObj, 'EEEE', { locale: id })}
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada data absensi untuk bulan ini
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ParentAttendance;