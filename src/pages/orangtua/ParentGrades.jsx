import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const ParentGrades = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noData, setNoData] = useState(false);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id) {
      setLoading(false);
      setNoData(true);
      return;
    }

    fetchChildren();
  }, [userData?.school_id, userData?.id]);

  useEffect(() => {
    if (selectedChild) {
      fetchData();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError('');
      setNoData(false);
      
      console.log('Fetching children for parent:', userData.id);
      
      // Untuk orang tua, ambil anak-anak berdasarkan parent_id
      const childrenData = await firestoreService.queryDocuments(
        'users',
        [
          { field: 'school_id', operator: '==', value: userData.school_id },
          { field: 'parent_id', operator: '==', value: userData.id },
          { field: 'role', operator: '==', value: 'student' }
        ],
        'name'
      );

      console.log('Children found:', childrenData.length, childrenData);
      
      if (childrenData.length === 0) {
        setNoData(true);
      }
      
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

  const fetchData = async () => {
    if (!selectedChild) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching data for child:', selectedChild);
      
      // 1. Fetch grades untuk anak yang dipilih
      const gradesData = await firestoreService.queryDocuments(
        'grades',
        [
          { field: 'school_id', operator: '==', value: userData.school_id },
          { field: 'student_id', operator: '==', value: selectedChild }
        ]
      );

      console.log('Grades found:', gradesData.length, gradesData);
      
      if (gradesData.length === 0) {
        setGrades([]);
        setSubjects([]);
        setLoading(false);
        return;
      }

      // 2. Get unique subject IDs from grades
      const subjectIds = [...new Set(gradesData.map(grade => grade.subject_id))].filter(Boolean);
      
      console.log('Subject IDs:', subjectIds);
      
      // 3. Fetch subject names for these IDs
      let subjectsData = [];
      if (subjectIds.length > 0) {
        // Karena Firestore tidak support IN query dengan array kosong
        // Kita ambil semua subjects sekolah lalu filter
        const allSubjects = await firestoreService.queryDocuments(
          'subjects',
          [
            { field: 'school_id', operator: '==', value: userData.school_id }
          ],
          'name'
        );
        
        subjectsData = allSubjects.filter(subject => 
          subjectIds.includes(subject.id)
        );
      }

      console.log('Subjects found:', subjectsData.length, subjectsData);
      
      // 4. Enrich grades with subject info
      const enrichedGrades = gradesData.map(grade => {
        const subject = subjectsData.find(s => s.id === grade.subject_id);
        return {
          ...grade,
          subjectName: subject?.name || 'Mata Pelajaran',
          subjectCode: subject?.code || '-'
        };
      });

      setGrades(enrichedGrades);
      setSubjects(subjectsData);
      
    } catch (error) {
      console.error('Error fetching grades:', error);
      setError('Gagal memuat data nilai');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedChild = () => {
    return children.find(child => child.id === selectedChild);
  };

  const calculateTotalGrade = (assignment, midterm, final) => {
    try {
      const assignmentScore = parseFloat(assignment) || 0;
      const midtermScore = parseFloat(midterm) || 0;
      const finalScore = parseFloat(final) || 0;
      
      const total = (assignmentScore * 0.3) + (midtermScore * 0.3) + (finalScore * 0.4);
      return total.toFixed(1);
    } catch {
      return '0.0';
    }
  };

  const getGradeColor = (score) => {
    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return 'bg-gray-100 text-gray-800';
    if (numericScore >= 85) return 'bg-green-100 text-green-800';
    if (numericScore >= 70) return 'bg-blue-100 text-blue-800';
    if (numericScore >= 55) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPredicate = (score) => {
    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return '-';
    if (numericScore >= 85) return 'A (Sangat Baik)';
    if (numericScore >= 70) return 'B (Baik)';
    if (numericScore >= 55) return 'C (Cukup)';
    if (numericScore >= 0) return 'D (Kurang)';
    return '-';
  };

  const getStatus = (score) => {
    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return 'Belum Ada Nilai';
    if (numericScore >= 55) return 'Lulus';
    return 'Tidak Lulus';
  };

  // Calculate overall average
  const overallAverage = grades.length > 0 
    ? (grades.reduce((sum, grade) => {
        const total = parseFloat(calculateTotalGrade(grade.assignment, grade.midterm, grade.final)) || 0;
        return sum + total;
      }, 0) / grades.length).toFixed(1)
    : 0;

  const selectedChildData = getSelectedChild();

  if (loading && children.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nilai Anak</h2>
        <p className="text-gray-600 mt-1">Pantau perkembangan akademik anak</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {noData ? (
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
      ) : children.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Memuat data anak...</p>
        </div>
      ) : (
        <>
          {/* Child Selection */}
          <div className="card">
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

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Memuat data nilai...</span>
            </div>
          ) : (
            <>
              {/* Child Info and Summary */}
              {selectedChildData && (
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
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
                        {overallAverage}
                      </div>
                      <div className="text-sm text-gray-600">Rata-rata</div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {grades.length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Total Mapel</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {grades.filter(g => {
                          const total = parseFloat(calculateTotalGrade(g.assignment, g.midterm, g.final));
                          return total >= 85;
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Nilai A</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {grades.filter(g => {
                          const total = parseFloat(calculateTotalGrade(g.assignment, g.midterm, g.final));
                          return total >= 55;
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Lulus</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-600">
                        {grades.filter(g => {
                          const total = parseFloat(calculateTotalGrade(g.assignment, g.midterm, g.final));
                          return total < 55;
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Tidak Lulus</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grades Table */}
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Detail Nilai</h3>
                  <span className="text-sm text-gray-600">
                    {grades.length} mata pelajaran
                  </span>
                </div>
                
                {grades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mata Pelajaran
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tugas (30%)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            UTS (30%)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            UAS (40%)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nilai Akhir
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Predikat
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grades.map((grade) => {
                          const totalScore = parseFloat(calculateTotalGrade(grade.assignment, grade.midterm, grade.final)) || 0;
                          
                          return (
                            <tr key={grade.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">
                                  {grade.subjectName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {grade.subjectCode}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {grade.assignment || '-'}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {grade.midterm || '-'}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {grade.final || '-'}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(totalScore)}`}>
                                  {totalScore.toFixed(1)}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getPredicate(totalScore)}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  totalScore >= 55 
                                    ? 'bg-green-100 text-green-800' 
                                    : totalScore > 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {getStatus(totalScore)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada nilai</h4>
                    <p className="text-gray-600">Nilai anak belum diinput oleh guru</p>
                  </div>
                )}
              </div>

              {/* Performance Chart */}
              {grades.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">Performa Akademik</h3>
                  
                  <div className="space-y-4">
                    {grades.map((grade) => {
                      const totalScore = parseFloat(calculateTotalGrade(grade.assignment, grade.midterm, grade.final)) || 0;
                      
                      return (
                        <div key={grade.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {grade.subjectName}
                            </span>
                            <span className="text-sm text-gray-600">
                              {totalScore.toFixed(1)} / 100
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                totalScore >= 85 ? 'bg-green-600' :
                                totalScore >= 70 ? 'bg-blue-600' :
                                totalScore >= 55 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(totalScore, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ParentGrades;