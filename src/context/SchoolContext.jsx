import React, { createContext, useState, useContext, useEffect } from 'react';
import { firestoreService } from '../firebase/firestoreService';
import { useAuth } from './AuthContext';

const SchoolContext = createContext();

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within SchoolProvider');
  }
  return context;
};

export const SchoolProvider = ({ children }) => {
  const [currentSchool, setCurrentSchool] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData, isSuperAdmin, isSchoolAdmin } = useAuth();

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!userData) {
        setLoading(false);
        return;
      }

      try {
        // Jika Super Admin, ambil semua sekolah
        if (isSuperAdmin) {
          const schoolsData = await firestoreService.queryDocuments(
            'schools',
            [],
            'name'
          );
          setSchools(schoolsData);
          
          // Set school pertama sebagai current jika belum ada
          if (schoolsData.length > 0 && !currentSchool) {
            setCurrentSchool(schoolsData[0]);
          }
        }
        // Jika admin/guru/murid/orangtua, ambil sekolah spesifik
        else if (userData.school_id) {
          const schoolDoc = await firestoreService.getDocument(
            'schools',
            userData.school_id
          );
          if (schoolDoc) {
            setCurrentSchool(schoolDoc);
            setSchools([schoolDoc]);
          }
        }
      } catch (error) {
        console.error('Error fetching school data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolData();
  }, [userData, isSuperAdmin]);

  const switchSchool = async (schoolId) => {
    try {
      const schoolDoc = await firestoreService.getDocument('schools', schoolId);
      if (schoolDoc) {
        setCurrentSchool(schoolDoc);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error switching school:', error);
      return false;
    }
  };

  const value = {
    currentSchool,
    schools,
    loading,
    switchSchool,
    isMultiSchool: isSuperAdmin
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
};