import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

const StudentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  // Real-time listener untuk pembayaran siswa
  useEffect(() => {
    if (!userData?.school_id || !userData?.id) return;

    const unsubscribe = firestoreService.listenToCollection(
      'payments',
      [
        { field: 'school_id', operator: '==', value: userData.school_id },
        { field: 'student_id', operator: '==', value: userData.id }
      ],
      (data) => {
        setPayments(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userData?.school_id, userData?.id]);

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

  // Kelompokkan pembayaran per bulan
  const paymentsByMonth = payments.reduce((acc, payment) => {
    const monthYear = payment.month;
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(payment);
    return acc;
  }, {});

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
        <h2 className="text-2xl font-bold text-gray-900">Pembayaran</h2>
        <p className="text-gray-600 mt-1">Riwayat pembayaran Anda</p>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Total Tagihan</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(
              payments.reduce((total, payment) => total + payment.amount, 0)
            )}
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Lunas</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {payments.filter(p => p.status === 'LUNAS').length} Bulan
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Tunggakan</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {payments.filter(p => p.status === 'BELUM').length} Bulan
          </p>
        </div>
      </div>

      {/* Daftar Pembayaran */}
      <div className="space-y-6">
        {Object.entries(paymentsByMonth).map(([monthYear, monthPayments]) => {
          const [year, month] = monthYear.split('-');
          const date = new Date(year, month - 1);
          
          return (
            <div key={monthYear} className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(date, 'MMMM yyyy', { locale: id })}
                </h3>
                {monthPayments.some(p => p.status === 'BELUM') ? (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Ada Tunggakan
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Lunas
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Keterangan
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Jumlah
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Tanggal Bayar
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Petugas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {monthPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {payment.description || 'Pembayaran SPP'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.payment_date 
                            ? format(new Date(payment.payment_date), 'dd/MM/yyyy')
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.recorded_by_name || 'TU Sekolah'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Total per bulan */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                <span className="font-medium text-gray-900">Total Bulan Ini:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(
                    monthPayments.reduce((sum, payment) => sum + payment.amount, 0)
                  )}
                </span>
              </div>
            </div>
          );
        })}
        
        {payments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada data pembayaran
            </h3>
            <p className="text-gray-600">
              Data pembayaran akan muncul setelah diinput oleh admin sekolah
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPayments;