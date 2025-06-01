import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

const NotFoundPage = () => {
  return (
    <MainLayout>
      <div className="container text-center" style={{ padding: '3rem' }}>
        <h1>404 - Page non trouvée</h1>
        <p>Désolé, la page que vous recherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" className="button-primary mt-1" style={{display: 'inline-block'}}>
          Retour à l'accueil
        </Link>
      </div>
    </MainLayout>
  );
};

export default NotFoundPage;