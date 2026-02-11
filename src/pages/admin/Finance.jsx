import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const Finance = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { userData } = useAuth();

  // Real-time listener untuk pembayaran
  useEffect(() => {
    if (!userData?.school_id) return;

    const unsubscribe = firestoreService.listenToCollection(
      'payments',
      [
        { field: 'school_id', operator: '==', value: userData.school_id }
      ],
      (data) => {
        setPayments(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userData?.school_id]);

  // Ambil data siswa
  useEffect(() => {
    if (!userData?.school_id) return;

    const fetchStudents = async () => {
      const studentsData = await firestoreService.queryDocuments(
        'users',
        [
          { field: 'school_id', operator: '==', value: userData.school_id },
          { field: 'role', operator: '==', value: 'student' },
          { field: 'status', operator: '==', value: 'active' }
        ],
        'name'
      );
      setStudents(studentsData);
    };

    fetchStudents();
  }, [userData?.school_id]);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !amount || !month) {
      alert('Harap lengkapi semua field');
      return;
    }

    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      student_id: selectedStudent,
      amount: parseFloat(amount),
      month: month,
      description: description || 'Pembayaran SPP',
      status: 'LUNAS',
      payment_method: 'CASH',
      recorded_by: userData.id,
      school_id: userData.school_id,
      payment_date: new Date().toISOString()
    };

    try {
      await firestoreService.createDocument('payments', paymentId, paymentData);
      
      // Reset form
      setSelectedStudent('');
      setAmount('');
      setDescription('');
      setMonth(format(new Date(), 'yyyy-MM'));
      setShowModal(false);
      
      alert('Pembayaran berhasil dicatat');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Gagal mencatat pembayaran');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'LUNAS': 'bg-green-100 text-green-800',
      'BELUM': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
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
          <h2 className="text-2xl font-bold text-gray-900">Keuangan</h2>
          <p className="text-gray-600 mt-1">Kelola pembayaran siswa</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Input Pembayaran
        </button>
      </div>

      {/* Tabel Pembayaran */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Petugas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => {
                const student = students.find(s => s.id === payment.student_id);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student?.class_name || 'No Class'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(payment.month + '-01'), 'MMMM yyyy', { locale: id })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.recorded_by_name || 'TU'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {payments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada data pembayaran
            </div>
          )}
        </div>
      </div>

      {/* Modal Input Pembayaran */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Input Pembayaran Baru
              </h3>
              
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Siswa
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Pilih Siswa</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.class_name || 'No Class'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bulan Pembayaran
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field"
                    placeholder="500000"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    placeholder="SPP Bulanan"
                  />
                </div>
                
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
                    Simpan Pembayaran
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

export default Finance;