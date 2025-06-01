import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom'; // Pour rediriger si non connecté

const ProfilePage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <MainLayout><div className="container loading-text">Chargement du profil...</div></MainLayout>;
  }

  if (!user) {
    // Normalement ProtectedRoute gère ça, mais double sécurité.
    return <Navigate to="/login" />;
  }

  return (
    <MainLayout>
      <div className="container">
        <div className="card mt-2" style={{padding: '2rem'}}>
            <h1>Profil de {user.username}</h1>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rôle:</strong> {user.role}</p>
            <p><strong>ID Utilisateur:</strong> {user.id}</p>
            <hr className='my-2'/>
            <p><em>Fonctionnalités à venir :</em></p>
            <ul>
                <li>Modifier les informations du profil</li>
                <li>Voir mes enchères (si vendeur)</li>
                <li>Voir mes offres et achats (si acheteur)</li>
                <li>Gérer les notifications</li>
            </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;