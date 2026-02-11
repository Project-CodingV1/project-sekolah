import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    target: 'all'
  });
  const [editingId, setEditingId] = useState(null);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id) {
      setLoading(false);
      return;
    }

    fetchAnnouncements();
  }, [userData?.school_id]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      
      const announcementsData = await firestoreService.queryDocuments(
        'announcements',
        [
          { field: 'school_id', operator: '==', value: userData.school_id }
        ],
        'created_at',
        'desc'
      );

      console.log('Announcements loaded:', announcementsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Gagal memuat data pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title || '',
      content: announcement.content || '',
      type: announcement.type || 'general',
      target: announcement.target || 'all'
    });
    setShowModal(true);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengumuman "${title}"?`)) return;
    
    try {
      setError('');
      const result = await firestoreService.deleteDocument('announcements', id);
      
      if (result.success) {
        alert('Pengumuman berhasil dihapus');
        fetchAnnouncements();
      } else {
        setError('Gagal menghapus pengumuman');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('Gagal menghapus pengumuman');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      const announcementData = {
        ...formData,
        school_id: userData.school_id,
        created_by: userData.id,
        author_name: userData.name,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let result;
      if (editingId) {
        // Update existing announcement
        result = await firestoreService.updateDocument('announcements', editingId, announcementData);
      } else {
        // Create new announcement
        const announcementId = `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        result = await firestoreService.createDocument('announcements', announcementId, announcementData);
      }
      
      if (result.success) {
        alert(editingId ? 'Pengumuman berhasil diperbarui' : 'Pengumuman berhasil dipublikasikan');
        resetForm();
        fetchAnnouncements();
      } else {
        setError(result.error || 'Gagal menyimpan pengumuman');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError('Gagal menyimpan pengumuman: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      target: 'all'
    });
    setEditingId(null);
    setShowModal(false);
    setError('');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengumuman</h2>
          <p className="text-gray-600 mt-1">Buat dan kelola pengumuman sekolah</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Buat Pengumuman
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
              Belum ada pengumuman
            </h3>
            <p className="text-gray-600">
              Buat pengumuman pertama untuk menginformasikan kegiatan sekolah
            </p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="card hover:shadow-md transition-shadow">
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
                
                <div className="ml-4 flex space-x-2">
                  <button 
                    onClick={() => handleEdit(announcement)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(announcement.id, announcement.title)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Pengumuman *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Judul pengumuman"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Pengumuman *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="general">Umum</option>
                      <option value="academic">Akademik</option>
                      <option value="event">Acara</option>
                      <option value="urgent">Penting</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Pembaca *
                    </label>
                    <select
                      name="target"
                      value={formData.target}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="all">Semua (Guru, Siswa, Orang Tua)</option>
                      <option value="teachers">Guru Saja</option>
                      <option value="students">Siswa Saja</option>
                      <option value="parents">Orang Tua Saja</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Isi Pengumuman *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="input-field min-h-[200px]"
                    placeholder="Tulis isi pengumuman di sini..."
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingId ? 'Perbarui' : 'Publikasikan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;