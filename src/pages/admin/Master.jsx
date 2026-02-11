import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { HiUserAdd, HiPencil, HiTrash, HiRefresh } from 'react-icons/hi';

const Master = () => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    nis: '',
    nip: '',
    class_id: '',
    parent_id: '',
    status: 'active',
    gender: '',
    birth_date: ''
  });
  
  const { userData } = useAuth();
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);

  // PERBAIKAN: Load initial data
  useEffect(() => {
    if (!userData?.school_id) {
      setLoading(false);
      return;
    }

    loadData();
    loadClasses();
    loadParents();
  }, [userData?.school_id, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      let collectionName = 'users';
      let filters = [
        { field: 'school_id', operator: '==', value: userData.school_id }
      ];

      // Filter berdasarkan role
      switch(activeTab) {
        case 'teachers':
          filters.push({ field: 'role', operator: '==', value: 'teacher' });
          break;
        case 'students':
          filters.push({ field: 'role', operator: '==', value: 'student' });
          break;
        case 'parents':
          filters.push({ field: 'role', operator: '==', value: 'parent' });
          break;
        default:
          break;
      }

      const results = await firestoreService.queryDocuments(
        collectionName,
        filters,
        'name'
      );
      
      setData(results);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await firestoreService.queryDocuments(
        'classes',
        [
          { field: 'school_id', operator: '==', value: userData.school_id }
        ],
        'grade_level'
      );
      setClasses(classesData);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadParents = async () => {
    try {
      const parentsData = await firestoreService.queryDocuments(
        'users',
        [
          { field: 'school_id', operator: '==', value: userData.school_id },
          { field: 'role', operator: '==', value: 'parent' }
        ],
        'name'
      );
      setParents(parentsData);
    } catch (err) {
      console.error('Error loading parents:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: activeTab === 'teachers' ? 'teacher' : 
            activeTab === 'students' ? 'student' : 'parent',
      nis: '',
      nip: '',
      class_id: '',
      parent_id: '',
      status: 'active',
      gender: '',
      birth_date: ''
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      role: item.role || activeTab,
      nis: item.nis || '',
      nip: item.nip || '',
      class_id: item.class_id || '',
      parent_id: item.parent_id || '',
      status: item.status || 'active',
      gender: item.gender || '',
      birth_date: item.birth_date || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validasi
      if (!formData.name.trim()) {
        throw new Error('Nama wajib diisi');
      }
      if (!formData.email.trim()) {
        throw new Error('Email wajib diisi');
      }
      
      const userDataToSave = {
        ...formData,
        school_id: userData.school_id,
        school_name: userData.school_name,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (editingId) {
        // Update existing
        result = await firestoreService.updateDocument('users', editingId, userDataToSave);
      } else {
        // Create new
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        userDataToSave.created_at = new Date().toISOString();
        
        // Untuk user baru, buat juga di Firebase Auth
        if (formData.email && formData.password) {
          // Catatan: Di production, buat user di Auth terlebih dahulu
          // Untuk demo, kita simpan password di Firestore (tidak recommended untuk production)
          userDataToSave.password = formData.password;
        }
        
        result = await firestoreService.createDocument('users', userId, userDataToSave);
      }

      // Refresh data
      await loadData();
      
      // Reset dan tutup modal
      resetForm();
      setShowModal(false);
      
      alert(editingId ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
      
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Gagal menyimpan data: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${name}?`)) {
      return;
    }
    
    try {
      // Untuk user, sebaiknya nonaktifkan bukan hapus
      await firestoreService.updateDocument('users', id, {
        status: 'inactive',
        updated_at: new Date().toISOString()
      });
      
      await loadData();
      alert('Data berhasil dinonaktifkan');
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  const renderTable = () => {
    switch(activeTab) {
      case 'teachers':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.nip || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <HiPencil className="inline w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <HiTrash className="inline w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'students':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orang Tua</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => {
                const parent = parents.find(p => p.id === item.parent_id);
                const classInfo = classes.find(c => c.id === item.class_id);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.nis || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {classInfo?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parent?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <HiPencil className="inline w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <HiTrash className="inline w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case 'parents':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Anak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => {
                const childrenCount = item.children_count || 
                  data.filter(s => s.parent_id === item.id).length;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {childrenCount} anak
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <HiPencil className="inline w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <HiTrash className="inline w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Master Data</h2>
          <p className="text-gray-600 mt-1">Kelola data guru, murid, dan orang tua</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadData}
            className="btn-secondary flex items-center"
          >
            <HiRefresh className="mr-2" />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center"
          >
            <HiUserAdd className="mr-2" />
            Tambah Data
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['teachers', 'students', 'parents'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                resetForm();
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'teachers' && 'Guru'}
              {tab === 'students' && 'Murid'}
              {tab === 'parents' && 'Orang Tua'}
            </button>
          ))}
        </nav>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {data.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <HiUserAdd className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada data {activeTab}
              </h3>
              <p className="text-gray-600">
                Tambah data pertama untuk memulai
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 btn-primary"
              >
                Tambah Data Pertama
              </button>
            </div>
          ) : (
            renderTable()
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? 'Edit Data' : 'Tambah Data Baru'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Minimal 8 karakter"
                      required={!editingId}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="0812-3456-7890"
                  />
                </div>
                
                {activeTab === 'students' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIS *
                      </label>
                      <input
                        type="text"
                        name="nis"
                        value={formData.nis}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Nomor Induk Siswa"
                        required={activeTab === 'students'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kelas *
                      </label>
                      <select
                        name="class_id"
                        value={formData.class_id}
                        onChange={handleInputChange}
                        className="input-field"
                        required={activeTab === 'students'}
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.grade_level}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Orang Tua
                      </label>
                      <select
                        name="parent_id"
                        value={formData.parent_id}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">Pilih Orang Tua</option>
                        {parents.map((parent) => (
                          <option key={parent.id} value={parent.id}>
                            {parent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                      </select>
                    </div>
                  </>
                )}
                
                {activeTab === 'teachers' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIP
                    </label>
                    <input
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Nomor Induk Pegawai"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Simpan Data'}
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

export default Master;