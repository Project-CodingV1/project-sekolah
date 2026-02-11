import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const ParentChildren = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id) {
      setLoading(false);
      return;
    }

    const fetchChildren = async () => {
      try {
        const childrenData = await firestoreService.queryDocuments(
          'users',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'parent_id', operator: '==', value: userData.id },
            { field: 'role', operator: '==', value: 'student' }
          ],
          'name'
        );

        // Fetch class information for each child
        const childrenWithClassInfo = await Promise.all(
          childrenData.map(async (child) => {
            if (child.class_id) {
              const classInfo = await firestoreService.getDocument('classes', child.class_id);
              return {
                ...child,
                className: classInfo?.name || 'Unknown Class',
                gradeLevel: classInfo?.grade_level || ''
              };
            }
            return child;
          })
        );

        setChildren(childrenWithClassInfo);
      } catch (error) {
        console.error('Error fetching children data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [userData?.school_id, userData?.id]);

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
        <h2 className="text-2xl font-bold text-gray-900">Data Anak</h2>
        <p className="text-gray-600 mt-1">Informasi anak-anak Anda</p>
      </div>

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
          {/* Children Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {child.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-600">{child.nis || 'Tidak ada NIS'}</p>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        </svg>
                        {child.className} - Kelas {child.gradeLevel}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {child.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      child.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {child.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                    
                    <div className="space-x-2">
                      <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                        Detail
                      </button>
                      <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                        Kontak
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Children Summary */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Ringkasan</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {children.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Anak</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {children.filter(c => c.gender === 'male').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Laki-laki</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {children.filter(c => c.gender === 'female').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Perempuan</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(children.map(c => c.gradeLevel)).size}
                </div>
                <div className="text-sm text-gray-600 mt-1">Tingkat Kelas</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentChildren;