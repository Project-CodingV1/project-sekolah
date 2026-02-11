import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch grades for this student
        const gradesData = await firestoreService.queryDocuments(
          'grades',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'student_id', operator: '==', value: userData.id }
          ]
        );

        // Fetch all subjects to get subject names
        const subjectsData = await firestoreService.queryDocuments(
          'subjects',
          [
            { field: 'school_id', operator: '==', value: userData.school_id }
          ],
          'name'
        );

        // Enrich grades with subject info
        const enrichedGrades = gradesData.map(grade => {
          const subject = subjectsData.find(s => s.id === grade.subject_id);
          return {
            ...grade,
            subjectName: subject?.name || 'Unknown Subject',
            subjectCode: subject?.code || ''
          };
        });

        setGrades(enrichedGrades);
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.school_id, userData?.id]);

  const calculateTotalGrade = (assignment, midterm, final) => {
    const assignmentScore = parseFloat(assignment) || 0;
    const midtermScore = parseFloat(midterm) || 0;
    const finalScore = parseFloat(final) || 0;
    
    const total = (assignmentScore * 0.3) + (midtermScore * 0.3) + (finalScore * 0.4);
    return total.toFixed(1);
  };

  const getGradeColor = (score) => {
    const numericScore = parseFloat(score);
    if (numericScore >= 85) return 'bg-green-100 text-green-800';
    if (numericScore >= 70) return 'bg-blue-100 text-blue-800';
    if (numericScore >= 55) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPredicate = (score) => {
    const numericScore = parseFloat(score);
    if (numericScore >= 85) return 'A (Sangat Baik)';
    if (numericScore >= 70) return 'B (Baik)';
    if (numericScore >= 55) return 'C (Cukup)';
    if (numericScore >= 0) return 'D (Kurang)';
    return '-';
  };

  const getStatus = (score) => {
    const numericScore = parseFloat(score);
    if (numericScore >= 55) return 'Lulus';
    return 'Tidak Lulus';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Calculate overall average
  const overallAverage = grades.length > 0 
    ? (grades.reduce((sum, grade) => sum + parseFloat(calculateTotalGrade(grade.assignment, grade.midterm, grade.final)), 0) / grades.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nilai Akademik</h2>
        <p className="text-gray-600 mt-1">Nilai mata pelajaran Anda</p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {grades.length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Mapel</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {overallAverage}
          </div>
          <div className="text-sm text-gray-600 mt-1">Rata-rata</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {grades.filter(g => {
              const total = parseFloat(calculateTotalGrade(g.assignment, g.midterm, g.final));
              return total >= 55;
            }).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Lulus</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {grades.filter(g => {
              const total = parseFloat(calculateTotalGrade(g.assignment, g.midterm, g.final));
              return total >= 85;
            }).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Nilai A</div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="card">
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
                const totalScore = parseFloat(calculateTotalGrade(grade.assignment, grade.midterm, grade.final));
                
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
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatus(totalScore)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {grades.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada nilai yang diinput
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart (Simulated) */}
      {grades.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Performa Akademik</h3>
          
          <div className="space-y-4">
            {grades.map((grade) => {
              const totalScore = parseFloat(calculateTotalGrade(grade.assignment, grade.midterm, grade.final));
              
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
    </div>
  );
};

export default StudentGrades;