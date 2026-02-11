import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const StudentSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.class_id) {
      setLoading(false);
      return;
    }

    const fetchSchedules = async () => {
      try {
        // Get schedules for student's class
        const schedulesData = await firestoreService.queryDocuments(
          'schedules',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'class_id', operator: '==', value: userData.class_id }
          ],
          'day'
        );

        // Enrich schedule data with subject info
        const enrichedSchedules = await Promise.all(
          schedulesData.map(async (schedule) => {
            const subjectData = await firestoreService.getDocument('subjects', schedule.subject_id);

            return {
              ...schedule,
              subjectName: subjectData?.name || 'Unknown Subject',
              subjectCode: subjectData?.code || ''
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
  }, [userData?.school_id, userData?.class_id]);

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

  const getCurrentDaySchedule = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    
    return schedules.filter(schedule => schedule.day === today)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentDaySchedule = getCurrentDaySchedule();
  const todayName = getIndonesianDayName(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Jadwal Pelajaran</h2>
        <p className="text-gray-600 mt-1">Jadwal pelajaran kelas Anda</p>
      </div>

      {/* Today's Schedule */}
      {currentDaySchedule.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Jadwal Hari Ini ({todayName})
          </h3>
          
          <div className="space-y-3">
            {currentDaySchedule.map((schedule, index) => {
              const currentTime = format(new Date(), 'HH:mm');
              const isCurrentClass = currentTime >= schedule.start_time && currentTime <= schedule.end_time;
              
              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    isCurrentClass 
                      ? 'bg-white border-2 border-primary-300 shadow-sm' 
                      : 'bg-white/80'
                  }`}
                >
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
                        {schedule.subjectCode}
                      </p>
                    </div>
                  </div>
                  
                  {isCurrentClass && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Sedang Berlangsung
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Jadwal Mingguan</h3>
        
        {groupSchedulesByDay().map((dayData) => (
          <div key={dayData.day} className="card">
            <h4 className="font-medium text-gray-900 mb-4">
              {dayData.dayName}
            </h4>
            
            {dayData.schedules.length > 0 ? (
              <div className="space-y-3">
                {dayData.schedules.map((schedule, index) => (
                  <div 
                    key={index} 
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
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
                          Kode: {schedule.subjectCode}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Tidak ada pelajaran pada hari ini
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Summary */}
      {schedules.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Rekap Jadwal</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {schedules.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Sesi</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(schedules.map(s => s.subjectName)).size}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Mapel</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(schedules.map(s => s.day)).size}
              </div>
              <div className="text-sm text-gray-600 mt-1">Hari Aktif</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {schedules.reduce((acc, curr) => {
                  const start = new Date(`2000-01-01T${curr.start_time}`);
                  const end = new Date(`2000-01-01T${curr.end_time}`);
                  return acc + (end - start) / (1000 * 60 * 60);
                }, 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Jam/Minggu</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSchedule;