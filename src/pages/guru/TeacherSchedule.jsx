import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id) return;

    const fetchSchedules = async () => {
      try {
        // First, get classes taught by this teacher
        const classesData = await firestoreService.queryDocuments(
          'classes',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'teacher_id', operator: '==', value: userData.id }
          ]
        );

        if (classesData.length === 0) {
          setLoading(false);
          return;
        }

        // Get class IDs
        const classIds = classesData.map(cls => cls.id);

        // Get schedules for these classes
        const schedulesData = await firestoreService.queryDocuments(
          'schedules',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'class_id', operator: 'in', value: classIds }
          ],
          'day'
        );

        // Enrich schedule data with class and subject info
        const enrichedSchedules = await Promise.all(
          schedulesData.map(async (schedule) => {
            const [classData, subjectData] = await Promise.all([
              firestoreService.getDocument('classes', schedule.class_id),
              firestoreService.getDocument('subjects', schedule.subject_id)
            ]);

            return {
              ...schedule,
              className: classData?.name || 'Unknown Class',
              subjectName: subjectData?.name || 'Unknown Subject'
            };
          })
        );

        setSchedules(enrichedSchedules);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [userData?.school_id, userData?.id]);

  const groupSchedulesByDay = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return days.map(day => {
      const daySchedules = schedules.filter(schedule => schedule.day === day);
      
      return {
        day,
        dayName: getIndonesianDayName(day),
        schedules: daySchedules.sort((a, b) => 
          a.start_time.localeCompare(b.start_time)
        )
      };
    });
  };

  const getIndonesianDayName = (englishDay) => {
    const dayMap = {
      'Monday': 'Senin',
      'Tuesday': 'Selasa',
      'Wednesday': 'Rabu',
      'Thursday': 'Kamis',
      'Friday': 'Jumat',
      'Saturday': 'Sabtu',
      'Sunday': 'Minggu'
    };
    
    return dayMap[englishDay] || englishDay;
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Jadwal Mengajar</h2>
        <p className="text-gray-600 mt-1">Jadwal mengajar Anda minggu ini</p>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada jadwal mengajar
          </h3>
          <p className="text-gray-600">
            Hubungi admin sekolah untuk mengatur jadwal mengajar
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupSchedulesByDay().map((dayData) => (
            <div key={dayData.day} className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {dayData.dayName}
              </h3>
              
              {dayData.schedules.length > 0 ? (
                <div className="space-y-3">
                  {dayData.schedules.map((schedule) => (
                    <div 
                      key={schedule.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.start_time}
                            </div>
                            <div className="text-xs text-gray-500">s/d</div>
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.end_time}
                            </div>
                          </div>
                          
                          <div className="w-px h-12 bg-gray-300"></div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {schedule.subjectName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Kelas: {schedule.className}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                          {schedule.className}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada jadwal mengajar pada hari ini
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule Summary */}
      {schedules.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Rekap Jadwal Minggu Ini</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {schedules.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Sesi</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(schedules.map(s => s.className)).size}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Kelas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(schedules.map(s => s.subjectName)).size}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Mapel</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(schedules.map(s => s.day)).size}
              </div>
              <div className="text-sm text-gray-600 mt-1">Hari Aktif</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;