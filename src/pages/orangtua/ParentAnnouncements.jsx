import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const ParentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState('all'); // all, urgent, academic, general
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id) {
      setLoading(false);
      return;
    }

    fetchAnnouncements();
  }, [userData?.school_id, filter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Filter untuk orang tua: semua pengumuman yang targetnya 'all' atau 'parents'
      const filters = [
        { field: 'school_id', operator: '==', value: userData.school_id }
      ];
      
      // Tambahkan filter type jika bukan 'all'
      if (filter !== 'all') {
        filters.push({ field: 'type', operator: '==', value: filter });
      }
      
      const announcementsData = await firestoreService.queryDocuments(
        'announcements',
        filters,
        'created_at',
        'desc'
      );

      // Filter untuk hanya menampilkan pengumuman yang ditujukan untuk orang tua
      const filteredAnnouncements = announcementsData.filter(announcement => 
        announcement.target === 'all' || announcement.target === 'parents'
      );

      console.log('Parent announcements loaded:', filteredAnnouncements.length);
      setAnnouncements(filteredAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Gagal memuat data pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      'general': { color: 'bg-blue-100 text-blue-800', label: 'Umum' },
      'academic': { color: 'bg-green-100 text-green-800', label: 'Akademik' },
      'event': { color: 'bg-purple-100 text-purple-800', label: 'Acara' },
      'urgent': { color: 'bg-red-100 text-red-800', label: 'Penting' }
    };
    
    const config = typeConfig[type] || typeConfig.general;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTargetBadge = (target) => {
    const targetConfig = {
      'all': { color: 'bg-gray-100 text-gray-800', label: 'Semua' },
      'teachers': { color: 'bg-indigo-100 text-indigo-800', label: 'Guru' },
      'students': { color: 'bg-cyan-100 text-cyan-800', label: 'Siswa' },
      'parents': { color: 'bg-amber-100 text-amber-800', label: 'Orang Tua' }
    };
    
    const config = targetConfig[target] || targetConfig.all;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Fungsi untuk format tanggal yang aman
  const formatDateSafely = (dateValue) => {
    try {
      if (!dateValue) return '';
      
      let dateObj;
      if (typeof dateValue === 'string') {
        dateObj = new Date(dateValue);
      } else if (dateValue.toDate) {
        // Firestore Timestamp
        dateObj = dateValue.toDate();
      } else if (dateValue.seconds) {
        // Firestore Timestamp (alternative format)
        dateObj = new Date(dateValue.seconds * 1000);
      } else {
        dateObj = new Date(dateValue);
      }
      
      // Validasi apakah date valid
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      return format(dateObj, 'dd MMMM yyyy', { locale: id });
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return '';
    }
  };

  if (loading && announcements.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengumuman Sekolah</h2>
        <p className="text-gray-600 mt-1">Informasi dan pengumuman dari sekolah</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'urgent' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Penting
          </button>
          <button
            onClick={() => setFilter('academic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'academic' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Akademik
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'event' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Acara
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada pengumuman
            </h3>
            <p className="text-gray-600">
              {filter !== 'all' 
                ? `Tidak ada pengumuman dengan filter "${filter}"` 
                : 'Belum ada pengumuman dari sekolah'}
            </p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`card hover:shadow-md transition-shadow ${
                announcement.type === 'urgent' 
                  ? 'border-l-4 border-red-500' 
                  : announcement.type === 'academic'
                  ? 'border-l-4 border-green-500'
                  : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getTypeBadge(announcement.type)}
                    {getTargetBadge(announcement.target)}
                    <span className="text-sm text-gray-500">
                      {formatDateSafely(announcement.created_at)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {announcement.title}
                  </h3>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">
                      {announcement.content}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {announcement.author_name || 'Admin Sekolah'}
                  </div>
                </div>
                
                {announcement.type === 'urgent' && (
                  <div className="ml-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium animate-pulse">
                      ⚠️ PENTING
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Announcement Stats */}
      {announcements.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Statistik Pengumuman</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {announcements.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {announcements.filter(a => a.type === 'urgent').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Penting</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {announcements.filter(a => a.type === 'academic').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Akademik</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {announcements.filter(a => a.target === 'parents').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Khusus Orang Tua</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAnnouncements;