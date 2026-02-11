import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const TeacherClasses = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id) return;

    // Fetch classes taught by this teacher
    const unsubscribe = firestoreService.listenToCollection(
      'classes',
      [
        { field: 'school_id', operator: '==', value: userData.school_id },
        { field: 'teacher_id', operator: '==', value: userData.id }
      ],
      (data) => {
        setClasses(data);
        
        // Fetch students for each class
        data.forEach(async (cls) => {
          const studentsData = await firestoreService.queryDocuments(
            'users',
            [
              { field: 'school_id', operator: '==', value: userData.school_id },
              { field: 'class_id', operator: '==', value: cls.id },
              { field: 'role', operator: '==', value: 'student' }
            ],
            'name'
          );
          
          setStudents(prev => ({
            ...prev,
            [cls.id]: studentsData
          }));
        });
        
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userData?.school_id, userData?.id]);

  if (loading && classes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Kelas yang Diampu</h2>
        <p className="text-gray-600 mt-1">Daftar kelas yang Anda ajar</p>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada kelas yang diampu
          </h3>
          <p className="text-gray-600">
            Hubungi admin sekolah untuk ditugaskan mengajar kelas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                  <p className="text-gray-600">Tingkat {cls.grade_level}</p>
                </div>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                  Wali Kelas
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Daftar Siswa</h4>
                
                {students[cls.id] ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {students[cls.id].map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.nis || '-'}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.status === 'active' ? (
                            <span className="text-green-600">Aktif</span>
                          ) : (
                            <span className="text-red-600">Nonaktif</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Memuat data siswa...
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Total Siswa: {students[cls.id]?.length || 0} orang
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                  Lihat Detail
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                  Ekspor Data
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;