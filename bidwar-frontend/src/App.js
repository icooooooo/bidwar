import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Link si vous avez un layout ici
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import NotFoundPage from './pages/NotFoundPage';
import AuctionsPage from './pages/AuctionsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext'; // Importer AuthProvider
// Importez un Layout/Navbar si vous en avez un
// import Navbar from './components/layout/Navbar';

function App() {
  return (
    <Router>
      <AuthProvider> {/* AuthProvider englobe tout ce qui a besoin du contexte d'authentification */}
        {/* <Navbar />  // Si vous avez une barre de navigation globale */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auctions" element={<AuctionsPage />} /> {/* Page publique pour lister les enchères */}
          <Route path="/auctions/:auctionId" element={<AuctionDetailPage />} /> {/* Page publique pour détail enchère */}
          
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
              <ProtectedRoute roles={['Vendeur', 'Admin']}> {/* Vérifiez que ces rôles correspondent à ceux dans votre JWT/modèle User */}
                <CreateAuctionPage />
              </ProtectedRoute>
            } 
          />
          
          {/* <Route path="/admin/dashboard" element={<ProtectedRoute roles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} /> */}
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        {/* <Footer /> // Si vous avez un footer global */}
      </AuthProvider>
    </Router>
  );
}

export default App;