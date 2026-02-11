import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import AppRoutes from './routes/AppRoutes';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SchoolProvider>
          <AppRoutes />
        </SchoolProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;