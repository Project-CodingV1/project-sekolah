import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthChange, logoutUser } from '../firebase/authService';
import { firestoreService } from '../firebase/firestoreService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Ambil data user dari Firestore
          const userDoc = await firestoreService.getDocument('users', user.uid);
          if (userDoc) {
            setUserData(userDoc);
            setError(null);
          } else {
            console.error('User document not found in Firestore');
            setUserData(null);
            setError('User data not found');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setError(error.message);
        }
      } else {
        setUserData(null);
        setError(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await loginUser(email, password);
      if (result.success) {
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setCurrentUser(null);
      setUserData(null);
      setError(null);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    error,
    isAuthenticated: !!currentUser,
    isSuperAdmin: userData?.role === 'super_admin',
    isSchoolAdmin: userData?.role === 'school_admin',
    isTeacher: userData?.role === 'teacher',
    isStudent: userData?.role === 'student',
    isParent: userData?.role === 'parent',
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};