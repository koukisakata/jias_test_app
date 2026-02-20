import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './components/Login';

import MainPage from './components/MainPage';

import UserList from './components/UserList';
import OfficeList from './components/OfficeList';
import TeamList from './components/TeamList';
import MakerList from './components/MakerList';
import HookList from './components/HookList';
import PleatList from './components/PleatList';
import InstallationMethodList from './components/InstallationMethodList';
import SeamAllowanceList from './components/SeamAllowanceList';
import CustomerList from './components/CustomerList';
import ProductList from './components/ProductList';

import ImportUsers from './components/ImportUsers';
import ImportOffices from './components/ImportOffices';
import ImportTeams from './components/ImportTeams';
import ImportMakers from './components/ImportMakers';
import ImportHooks from './components/ImportHooks';
import ImportPleats from './components/ImportPleats';
import ImportInstallationMethods from './components/ImportInstallationMethods';
import ImportSeamAllowances from './components/ImportSeamAllowances';
import ImportCustomers from './components/ImportCustomers';
import ImportProducts from './components/ImportProducts';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />

        <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
        <Route path="/offices" element={<ProtectedRoute><OfficeList /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><TeamList /></ProtectedRoute>} />
        <Route path="/makers" element={<ProtectedRoute><MakerList /></ProtectedRoute>} />
        <Route path="/hooks" element={<ProtectedRoute><HookList /></ProtectedRoute>} />
        <Route path="/pleats" element={<ProtectedRoute><PleatList /></ProtectedRoute>} />
        <Route path="/installations" element={<ProtectedRoute><InstallationMethodList /></ProtectedRoute>} />
        <Route path="/seam-allowances" element={<ProtectedRoute><SeamAllowanceList /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />

        <Route path="/import/users" element={<ProtectedRoute><ImportUsers /></ProtectedRoute>} />
        <Route path="/import/offices" element={<ProtectedRoute><ImportOffices /></ProtectedRoute>} />
        <Route path="/import/teams" element={<ProtectedRoute><ImportTeams /></ProtectedRoute>} />
        <Route path="/import/makers" element={<ProtectedRoute><ImportMakers /></ProtectedRoute>} />
        <Route path="/import/hooks" element={<ProtectedRoute><ImportHooks /></ProtectedRoute>} />
        <Route path="/import/pleats" element={<ProtectedRoute><ImportPleats /></ProtectedRoute>} />
        <Route path="/import/installations" element={<ProtectedRoute><ImportInstallationMethods /></ProtectedRoute>} />
        <Route path="/import/seam-allowances" element={<ProtectedRoute><ImportSeamAllowances /></ProtectedRoute>} />
        <Route path="/import/customers" element={<ProtectedRoute><ImportCustomers /></ProtectedRoute>} />
        <Route path="/import/products" element={<ProtectedRoute><ImportProducts /></ProtectedRoute>} />
        
        
      </Routes>
    </Router>
  );
}

export default App;