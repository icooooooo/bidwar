import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auctions/:auctionId" element={<AuctionDetailPage />} />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/auctions/new" 
          element={
            <ProtectedRoute roles={['Seller', 'Admin']}>
              <CreateAuctionPage />
            </ProtectedRoute>
          } 
        />
        
        {/* TODO: Ajouter d'autres routes (FAQ, Termes, Dashboards Admin) */}
        {/* <Route path="/admin/dashboard" element={<ProtectedRoute roles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} /> */}
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;