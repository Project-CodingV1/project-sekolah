import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { firestoreService } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const ParentPayments = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { userData } = useAuth();

  // DEBUG: Log initial state
  console.log('ParentPayments Component Loaded');
  console.log('User Data:', userData);
  console.log('Loading state:', loading);

  useEffect(() => {
    if (!userData) {
      console.log('No user data yet');
      return;
    }

    console.log('User has data, school_id:', userData.school_id);
    console.log('User ID:', userData.id);
    console.log('User role:', userData.role);

    fetchChildren();
  }, [userData]);

  useEffect(() => {
    if (selectedChild) {
      console.log('Selected child changed to:', selectedChild);
      fetchPayments();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching children for parent ID:', userData.id);
      console.log('School ID:', userData.school_id);

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

      console.log('Children data received:', childrenData);
      console.log('Number of children:', childrenData.length);

      setChildren(childrenData);
      
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0].id);
        console.log('First child selected:', childrenData[0].id);
      } else {
        console.log('No children found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setError(`Gagal memuat data anak: ${error.message}`);
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!selectedChild) {
      console.log('No child selected, skipping payments fetch');
      return;
    }

    try {
      setRefreshing(true);
      setError('');
      
      console.log('Fetching payments for child:', selectedChild);
      console.log('School ID:', userData.school_id);

      const paymentsData = await firestoreService.queryDocuments(
        'payments',
        [
          { field: 'school_id', operator: '==', value: userData.school_id },
          { field: 'student_id', operator: '==', value: selectedChild }
        ],
        'month',
        'desc'
      );

      console.log('Payments data received:', paymentsData);
      console.log('Number of payments:', paymentsData.length);

      // Transform data untuk memastikan format konsisten
      const processedPayments = paymentsData.map(payment => {
        // Handle date formatting
        let paymentDate = '-';
        try {
          if (payment.payment_date) {
            if (typeof payment.payment_date === 'string') {
              paymentDate = format(parseISO(payment.payment_date), 'dd/MM/yyyy');
            } else if (payment.payment_date.toDate) {
              paymentDate = format(payment.payment_date.toDate(), 'dd/MM/yyyy');
            }
          }
        } catch (e) {
          console.warn('Error formatting payment date:', e);
        }

        // Handle month formatting
        let monthDisplay = payment.month || '-';
        try {
          if (payment.month && payment.month.includes('-')) {
            const [year, month] = payment.month.split('-');
            const date = new Date(year, month - 1);
            monthDisplay = format(date, 'MMMM yyyy', { locale: id });
          }
        } catch (e) {
          console.warn('Error formatting month:', e);
        }

        return {
          ...payment,
          id: payment.id || `payment_${Date.now()}_${Math.random()}`,
          month_display: monthDisplay,
          payment_date_display: paymentDate,
          amount: payment.amount || 0,
          status: payment.status || 'BELUM'
        };
      });

      console.log('Processed payments:', processedPayments);
      setPayments(processedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(`Gagal memuat data pembayaran: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSelectedChild = () => {
    return children.find(child => child.id === selectedChild);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'LUNAS': { color: 'bg-green-100 text-green-800', label: 'LUNAS' },
      'BELUM': { color: 'bg-red-100 text-red-800', label: 'BELUM' },
      'SEBAGIAN': { color: 'bg-yellow-100 text-yellow-800', label: 'SEBAGIAN' }
    };
    
    const config = statusConfig[status] || statusConfig['BELUM'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Group payments by month
  const paymentsByMonth = payments.reduce((acc, payment) => {
    const monthYear = payment.month || 'unknown';
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(payment);
    return acc;
  }, {});

  // Calculate summary
  const summary = {
    totalPayments: payments.length,
    totalPaid: payments.filter(p => p.status === 'LUNAS').reduce((sum, p) => sum + (p.amount || 0), 0),
    totalUnpaid: payments.filter(p => p.status === 'BELUM').reduce((sum, p) => sum + (p.amount || 0), 0),
    paidCount: payments.filter(p => p.status === 'LUNAS').length,
    unpaidCount: payments.filter(p => p.status === 'BELUM').length
  };

  const selectedChildData = getSelectedChild();

  // Debug: Log current state
  console.log('Current state - loading:', loading);
  console.log('Current state - refreshing:', refreshing);
  console.log('Current state - children count:', children.length);
  console.log('Current state - payments count:', payments.length);

  if (loading && children.length === 0) {
    console.log('Showing loader');
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pembayaran Sekolah</h2>
        <p className="text-gray-600 mt-1">Pantau status pembayaran sekolah anak</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={fetchChildren}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Debug Info Panel - Hapus di production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          <div className="font-semibold mb-1">Debug Info:</div>
          <div>Parent ID: {userData?.id || 'N/A'}</div>
          <div>Children Count: {children.length}</div>
          <div>Selected Child: {selectedChild || 'N/A'}</div>
          <div>Payments Count: {payments.length}</div>
          <div>Loading: {loading.toString()}</div>
        </div>
      )}

      {children.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75a3.75 3.75 0 01-7.5 0m7.5 0a3.75 3.75 0 00-7.5 0" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada anak terdaftar
          </h3>
          <p className="text-gray-600 mb-4">
            Hubungi admin sekolah untuk menambahkan data anak
          </p>
          <button 
            onClick={fetchChildren}
            className="btn-primary"
          >
            <i className="fas fa-redo mr-2"></i>
            Refresh Data
          </button>
        </div>
      ) : (
        <>
          {/* Child Selection */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Pilih Anak
              </label>
              <button 
                onClick={fetchPayments}
                disabled={refreshing}
                className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
              >
                <i className={`fas fa-redo ${refreshing ? 'animate-spin' : ''} mr-1`}></i>
                Refresh
              </button>
            </div>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="input-field"
              disabled={refreshing}
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} - {child.nis ? `NIS: ${child.nis}` : 'No NIS'} {child.class_name ? ` | Kelas: ${child.class_name}` : ''}
                </option>
              ))}
            </select>
          </div>

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
                      {selectedChildData.nis && `NIS: ${selectedChildData.nis}`}
                      {selectedChildData.class_name && ` | Kelas: ${selectedChildData.class_name}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {summary.totalPayments}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Tagihan</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalPaid)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Sudah Dibayar</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalUnpaid)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Belum Dibayar</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {summary.unpaidCount}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Bulan Tertunggak</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State for Payments */}
          {refreshing && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Memuat data pembayaran...</span>
            </div>
          )}

          {/* Payment Details */}
          {!refreshing && (
            <div className="space-y-6">
              {Object.keys(paymentsByMonth).length === 0 ? (
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
              ) : (
                Object.entries(paymentsByMonth).map(([monthYear, monthPayments]) => {
                  const monthTotal = monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                  const monthPaid = monthPayments
                    .filter(p => p.status === 'LUNAS')
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                  
                  const monthStatus = monthPaid === monthTotal ? 'LUNAS' : 
                                     monthPaid > 0 ? 'SEBAGIAN' : 'BELUM';
                  
                  // Try to format month display
                  let monthDisplay = monthYear;
                  try {
                    if (monthYear.includes('-')) {
                      const [year, month] = monthYear.split('-');
                      const date = new Date(year, month - 1);
                      monthDisplay = format(date, 'MMMM yyyy', { locale: id });
                    }
                  } catch (e) {
                    console.warn('Error formatting month in display:', e);
                  }
                  
                  return (
                    <div key={monthYear} className="card">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {monthDisplay}
                        </h3>
                        {getStatusBadge(monthStatus)}
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
                                  {payment.payment_date_display || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {payment.recorded_by_name || 'TU Sekolah'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Month Summary */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-900">Total Bulan Ini:</span>
                            <span className="ml-2 font-bold text-gray-900">
                              {formatCurrency(monthTotal)}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              Terbayar: {formatCurrency(monthPaid)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Sisa: {formatCurrency(monthTotal - monthPaid)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Payment Information */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Informasi Pembayaran</h3>
            
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pembayaran dilakukan secara tunai ke Tata Usaha sekolah</span>
              </li>
              
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Setelah pembayaran, status akan diupdate oleh admin sekolah</span>
              </li>
              
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Untuk pertanyaan mengenai pembayaran, hubungi Tata Usaha sekolah</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentPayments;