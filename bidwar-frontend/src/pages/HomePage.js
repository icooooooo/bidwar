import React from 'react'; // Plus besoin de useState, useEffect, useCallback ici pour les enchères
import MainLayout from '../components/layout/MainLayout';
import AuctionList from '../components/auctions/AuctionList'; // IMPORTER AUCTIONLIST
import './HomePage.css';
import { useLocation } from 'react-router-dom';

const HomePage = () => {
  const location = useLocation(); // Pour récupérer les messages de redirection

  // Toute la logique de fetch, loading, error, pagination pour les enchères
  // est maintenant gérée par le composant AuctionList.

  return (
    <MainLayout>
      <div className="homepage-container container">
        {location.state?.unauthorized && (
          <div className="error-message mb-2">
            Accès non autorisé à {location.state.attemptedPath}. Vous avez été redirigé.
          </div>
        )}
        <h1 className="homepage-title">Enchères Disponibles</h1>
        
        {/* Simplement inclure AuctionList ici */}
        <AuctionList /> 

        {/* Si vous voulez toujours une section séparée pour les enchères terminées,
            vous pourriez créer un autre <AuctionList statusFilter="Ended" /> ou
            modifier AuctionList pour accepter un filtre de statut en prop,
            ou faire un autre appel API ici pour les enchères terminées spécifiquement.
            Pour l'instant, concentrons-nous sur l'affichage principal.
        */}
      </div>
    </MainLayout>
  );
};

export default HomePage;