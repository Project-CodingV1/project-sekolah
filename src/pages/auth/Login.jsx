import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../firebase/authService';
import { firestoreService } from '../../firebase/firestoreService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Clear any existing auth data on login page
  useEffect(() => {
    localStorage.removeItem('userData');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginUser(email, password);
    
    if (result.success) {
      try {
        const userDoc = await firestoreService.getDocument('users', result.user.uid);
        
        if (userDoc) {
          // Redirect berdasarkan role
          switch (userDoc.role) {
            case 'super_admin':
              navigate('/superadmin/schools');
              break;
            case 'school_admin':
              navigate('/admin/master');
              break;
            case 'teacher':
              navigate('/guru/classes');
              break;
            case 'student':
              navigate('/murid/classes');
              break;
            case 'parent':
              navigate('/orangtua/children');
              break;
            default:
              navigate('/');
          }
        } else {
          setError('Data pengguna tidak ditemukan di sistem');
          // Force logout jika user tidak ada di Firestore
          await logoutUser();
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Gagal memuat data pengguna');
        await logoutUser();
      }
    } else {
      setError(result.error || 'Login gagal');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistem Informasi Sekolah
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Multi-School Platform
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="admin@sekolah.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-600">
          <p>Gunakan email dan password yang diberikan administrator</p>
          <p className="mt-2 text-xs">Role: Super Admin, Admin Sekolah, Guru, Murid, Orang Tua</p>
        </div>
      </div>
    </div>
  );
};

export default Login;