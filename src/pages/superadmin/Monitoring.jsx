import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { format } from 'date-fns';

const Monitoring = () => {
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    totalTeachers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all schools
        const schoolsData = await firestoreService.queryDocuments('schools', []);
        
        // Get stats for each school
        const schoolsWithStats = await Promise.all(
          schoolsData.map(async (school) => {
            const [students, teachers] = await Promise.all([
              firestoreService.queryDocuments('users', [
                { field: 'school_id', operator: '==', value: school.id },
                { field: 'role', operator: '==', value: 'student' }
              ]),
              firestoreService.queryDocuments('users', [
                { field: 'school_id', operator: '==', value: school.id },
                { field: 'role', operator: '==', value: 'teacher' }
              ])
            ]);
            
            return {
              ...school,
              studentCount: students.length,
              teacherCount: teachers.length
            };
          })
        );
        
        setSchools(schoolsWithStats);
        
        // Calculate total stats
        const totalStats = {
          totalSchools: schoolsData.length,
          activeSchools: schoolsData.filter(s => s.status === 'active').length,
          totalStudents: schoolsWithStats.reduce((sum, school) => sum + school.studentCount, 0),
          totalTeachers: schoolsWithStats.reduce((sum, school) => sum + school.teacherCount, 0)
        };
        
        setStats(totalStats);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up real-time listener for schools
    const unsubscribe = firestoreService.listenToCollection('schools', [], () => {
      fetchData();
    });

    return unsubscribe;
  }, []);

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
        <h2 className="text-2xl font-bold text-gray-900">Monitoring Platform</h2>
        <p className="text-gray-600 mt-1">Overview seluruh sekolah dalam sistem</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-2xl font-bold text-primary-600">
            {stats.totalSchools}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Sekolah</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-green-600">
            {stats.activeSchools}
          </div>
          <div className="text-sm text-gray-600 mt-1">Sekolah Aktif</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalStudents.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Siswa</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-purple-600">
            {stats.totalTeachers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Guru</div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Daftar Sekolah</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Sekolah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bergabung
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{school.name}</div>
                    <div className="text-sm text-gray-500">{school.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {school.type}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {school.studentCount} siswa
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      {school.teacherCount} guru
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      school.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {school.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {school.created_at 
                      ? format(school.created_at.toDate(), 'dd/MM/yyyy')
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {schools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada sekolah terdaftar
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitoring;