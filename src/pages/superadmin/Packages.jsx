import React, { useState, useEffect } from 'react';
import { firestoreService } from '../../firebase/firestoreService';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialPackages = [
      {
        id: 'basic',
        name: 'Paket Basic',
        description: 'Fitur dasar untuk sekolah kecil',
        price: 500000,
        max_students: 100,
        max_teachers: 10,
        features: ['Absensi', 'Nilai', 'Data Master']
      },
      {
        id: 'standard',
        name: 'Paket Standard',
        description: 'Fitur lengkap untuk sekolah menengah',
        price: 1000000,
        max_students: 500,
        max_teachers: 30,
        features: ['Semua fitur Basic', 'Keuangan', 'Pengumuman', 'Laporan']
      },
      {
        id: 'premium',
        name: 'Paket Premium',
        description: 'Fitur premium untuk sekolah besar',
        price: 2000000,
        max_students: 2000,
        max_teachers: 100,
        features: ['Semua fitur Standard', 'Multi Admin', 'API Access', 'Priority Support']
      }
    ];

    setPackages(initialPackages);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paket Layanan</h2>
        <p className="text-gray-600 mt-1">Kelola paket untuk sekolah</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`card border-2 ${
            pkg.id === 'standard' ? 'border-primary-300 ring-2 ring-primary-50' : 'border-gray-200'
          }`}>
            {pkg.id === 'standard' && (
              <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                POPULAR
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
              <p className="text-gray-600 mt-1">{pkg.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(pkg.price)}
                </span>
                <span className="text-gray-600">/bulan</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Kapasitas:</h4>
              <ul className="space-y-2 mb-6">
                <li className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Siswa:</span>
                  <span className="font-medium">{pkg.max_students}</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Guru:</span>
                  <span className="font-medium">{pkg.max_teachers}</span>
                </li>
              </ul>
              
              <h4 className="font-semibold text-gray-900 mb-3">Fitur:</h4>
              <ul className="space-y-2">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className={`w-full py-2 px-4 rounded-lg font-medium ${
                pkg.id === 'standard' 
                  ? 'btn-primary' 
                  : 'btn-secondary'
              }`}>
                Pilih Paket
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Packages;