import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const Academic = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'class',
    name: '',
    grade_level: '',
    teacher_id: '',
    subject_name: '',
    subject_code: '',
    day: 'Monday',
    start_time: '',
    end_time: '',
    class_id: '',
    subject_id: ''
  });
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id) return;

    const fetchData = async () => {
      try {
        // Fetch classes
        const classesData = await firestoreService.queryDocuments(
          'classes',
          [
            { field: 'school_id', operator: '==', value: userData.school_id }
          ],
          'grade_level'
        );
        setClasses(classesData);

        // Fetch subjects
        const subjectsData = await firestoreService.queryDocuments(
          'subjects',
          [
            { field: 'school_id', operator: '==', value: userData.school_id }
          ],
          'name'
        );
        setSubjects(subjectsData);

        // Fetch schedules
        const schedulesData = await firestoreService.queryDocuments(
          'schedules',
          [
            { field: 'school_id', operator: '==', value: userData.school_id }
          ],
          'day'
        );
        setSchedules(schedulesData);

        // Fetch teachers
        const teachersData = await firestoreService.queryDocuments(
          'users',
          [
            { field: 'school_id', operator: '==', value: userData.school_id },
            { field: 'role', operator: '==', value: 'teacher' }
          ],
          'name'
        );
        setTeachers(teachersData);

      } catch (error) {
        console.error('Error fetching academic data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.school_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let documentId;
      let collectionName;
      let dataToSave;

      switch (formData.type) {
        case 'class':
          documentId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          collectionName = 'classes';
          dataToSave = {
            name: formData.name,
            grade_level: formData.grade_level,
            teacher_id: formData.teacher_id,
            school_id: userData.school_id
          };
          break;
        
        case 'subject':
          documentId = `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          collectionName = 'subjects';
          dataToSave = {
            name: formData.subject_name,
            code: formData.subject_code,
            school_id: userData.school_id
          };
          break;
        
        case 'schedule':
          documentId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          collectionName = 'schedules';
          dataToSave = {
            day: formData.day,
            start_time: formData.start_time,
            end_time: formData.end_time,
            class_id: formData.class_id,
            subject_id: formData.subject_id,
            school_id: userData.school_id
          };
          break;
        
        default:
          return;
      }

      await firestoreService.createDocument(collectionName, documentId, dataToSave);
      
      // Reset form
      setFormData({
        type: 'class',
        name: '',
        grade_level: '',
        teacher_id: '',
        subject_name: '',
        subject_code: '',
        day: 'Monday',
        start_time: '',
        end_time: '',
        class_id: '',
        subject_id: ''
      });
      setShowModal(false);
      
      alert('Data berhasil disimpan');
      window.location.reload();
    } catch (error) {
      console.error('Error saving academic data:', error);
      alert('Gagal menyimpan data');
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'classes': return classes;
      case 'subjects': return subjects;
      case 'schedules': return schedules;
      default: return [];
    }
  };

  const renderRow = (item) => {
    switch (activeTab) {
      case 'classes':
        const teacher = teachers.find(t => t.id === item.teacher_id);
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.grade_level}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {teacher?.name || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.student_count || 0} siswa
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
              <button className="text-red-600 hover:text-red-900">Hapus</button>
            </td>
          </tr>
        );
      
      case 'subjects':
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
              {item.code}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
              <button className="text-red-600 hover:text-red-900">Hapus</button>
            </td>
          </tr>
        );
      
      case 'schedules':
        const classItem = classes.find(c => c.id === item.class_id);
        const subject = subjects.find(s => s.id === item.subject_id);
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.day}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.start_time} - {item.end_time}
            </td>
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
              {classItem?.name || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {subject?.name || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
              <button className="text-red-600 hover:text-red-900">Hapus</button>
            </td>
          </tr>
        );
      
      default:
        return null;
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Akademik</h2>
          <p className="text-gray-600 mt-1">Kelola kelas, mata pelajaran, dan jadwal</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Tambah Data
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['classes', 'subjects', 'schedules'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'classes' && 'Kelas'}
              {tab === 'subjects' && 'Mata Pelajaran'}
              {tab === 'schedules' && 'Jadwal'}
            </button>
          ))}
        </nav>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {activeTab === 'classes' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wali Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </>
                )}
                {activeTab === 'subjects' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </>
                )}
                {activeTab === 'schedules' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hari</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentData().map(renderRow)}
            </tbody>
          </table>
          
          {getCurrentData().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada data {activeTab}
            </div>
          )}
        </div>
      </div>

      {/* Add Data Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tambah Data Akademik
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Data
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="class">Kelas</option>
                    <option value="subject">Mata Pelajaran</option>
                    <option value="schedule">Jadwal</option>
                  </select>
                </div>
                
                {formData.type === 'class' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Kelas
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Contoh: 7A"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tingkat Kelas
                      </label>
                      <select
                        name="grade_level"
                        value={formData.grade_level}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="">Pilih Tingkat</option>
                        <option value="1">Kelas 1</option>
                        <option value="2">Kelas 2</option>
                        <option value="3">Kelas 3</option>
                        <option value="4">Kelas 4</option>
                        <option value="5">Kelas 5</option>
                        <option value="6">Kelas 6</option>
                        <option value="7">Kelas 7</option>
                        <option value="8">Kelas 8</option>
                        <option value="9">Kelas 9</option>
                        <option value="10">Kelas 10</option>
                        <option value="11">Kelas 11</option>
                        <option value="12">Kelas 12</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wali Kelas
                      </label>
                      <select
                        name="teacher_id"
                        value={formData.teacher_id}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">Pilih Wali Kelas</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                
                {formData.type === 'subject' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kode Mata Pelajaran
                      </label>
                      <input
                        type="text"
                        name="subject_code"
                        value={formData.subject_code}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Contoh: MTK-001"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Mata Pelajaran
                      </label>
                      <input
                        type="text"
                        name="subject_name"
                        value={formData.subject_name}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Contoh: Matematika"
                        required
                      />
                    </div>
                  </>
                )}
                
                {formData.type === 'schedule' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hari
                        </label>
                        <select
                          name="day"
                          value={formData.day}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        >
                          <option value="Monday">Senin</option>
                          <option value="Tuesday">Selasa</option>
                          <option value="Wednesday">Rabu</option>
                          <option value="Thursday">Kamis</option>
                          <option value="Friday">Jumat</option>
                          <option value="Saturday">Sabtu</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kelas
                        </label>
                        <select
                          name="class_id"
                          value={formData.class_id}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        >
                          <option value="">Pilih Kelas</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mata Pelajaran
                        </label>
                        <select
                          name="subject_id"
                          value={formData.subject_id}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        >
                          <option value="">Pilih Mata Pelajaran</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Waktu Mulai
                        </label>
                        <input
                          type="time"
                          name="start_time"
                          value={formData.start_time}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Waktu Selesai
                      </label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Simpan Data
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

export default Academic;