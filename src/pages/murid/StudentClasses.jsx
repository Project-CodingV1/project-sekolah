import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const StudentClasses = () => {
  const [classData, setClassData] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.class_id) {
      setLoading(false);
      return;
    }

    const fetchClassData = async () => {
      try {
        // Fetch class information
        const classInfo = await firestoreService.getDocument('classes', userData.class_id);
        setClassData(classInfo);

        // Fetch classmates
        const classmatesData = await firestoreService.queryDocuments(
          'users',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'class_id', operator: '==', value: userData.class_id },
            { field: 'role', operator: '==', value: 'student' }
          ],
          'name'
        );
        setClassmates(classmatesData);

        // Fetch teacher if class has teacher_id
        if (classInfo?.teacher_id) {
          const teacherData = await firestoreService.getDocument('users', classInfo.teacher_id);
          setTeacher(teacherData);
        }

      } catch (error) {
        console.error('Error fetching class data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [userData?.school_id, userData?.class_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" opacity="0.5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" opacity="0.25" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Belum terdaftar di kelas
        </h3>
        <p className="text-gray-600">
          Hubungi wali kelas atau admin sekolah untuk informasi kelas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Kelas Saya</h2>
        <p className="text-gray-600 mt-1">Informasi kelas dan teman sekelas</p>
      </div>

      {/* Class Information Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{classData.name}</h3>
            <p className="text-gray-600">Tingkat {classData.grade_level}</p>
          </div>
          <span className="mt-2 md:mt-0 px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
            Kelas Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teacher Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Wali Kelas</h4>
            {teacher ? (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-primary-600">
                    {teacher.name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{teacher.name}</div>
                  <div className="text-sm text-gray-600">{teacher.email}</div>
                  {teacher.phone && (
                    <div className="text-sm text-gray-600">{teacher.phone}</div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Belum ada wali kelas</p>
            )}
          </div>

          {/* Class Statistics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Statistik Kelas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {classmates.length}
                </div>
                <div className="text-sm text-gray-600">Total Siswa</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {classmates.filter(s => s.gender === 'male').length}
                </div>
                <div className="text-sm text-gray-600">Laki-laki</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {classmates.filter(s => s.gender === 'female').length}
                </div>
                <div className="text-sm text-gray-600">Perempuan</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {classmates.filter(s => s.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Aktif</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classmates List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Teman Sekelas</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Kelamin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classmates.map((classmate, index) => (
                <tr key={classmate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classmate.nis || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {classmate.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classmate.gender === 'male' ? 'Laki-laki' : 
                     classmate.gender === 'female' ? 'Perempuan' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      classmate.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {classmate.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentClasses;