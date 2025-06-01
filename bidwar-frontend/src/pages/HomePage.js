import React, { useState, useEffect } from 'react';
import AuctionCard from '../components/auctions/AuctionCard';
import MainLayout from '../components/layout/MainLayout';
import { fetchAllAuctions } from '../services/auctionService'; // Utilise fetchAllAuctions
import './HomePage.css';
import { useLocation } from 'react-router-dom';

const HomePage = () => {
  const [allAuctions, setAllAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation(); // Pour récupérer les messages de redirection

  useEffect(() => {
    const loadAuctions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllAuctions();
        setAllAuctions(data);
      } catch (err) {
        console.error("Failed to fetch auctions:", err);
        setError("Impossible de charger les enchères. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };
    loadAuctions();
  }, []);

  const activeAuctions = allAuctions.filter(auc => auc.status === 'Active' || auc.status === 'Pending Approval'); // Inclut Pending Approval pour que le vendeur puisse voir
  const endedAuctions = allAuctions.filter(auc => auc.status === 'Ended');


  return (
    <MainLayout>
      <div className="homepage-container container">
        {location.state?.unauthorized && (
          <div className="error-message mb-2">
            Accès non autorisé à {location.state.attemptedPath}. Vous avez été redirigé.
          </div>
        )}
        <h1 className="homepage-title">Enchères en cours</h1>
        {loading && <p className="loading-text">Chargement des enchères...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && !error && activeAuctions.length === 0 && <p>Aucune enchère active pour le moment.</p>}
        <div className="auctions-grid">
          {!loading && activeAuctions.map(auction => (
            <AuctionCard key={auction.auction_id} auction={auction} />
          ))}
        </div>

        {endedAuctions.length > 0 && (
            <>
                <h2 className="homepage-subtitle">Enchères terminées</h2>
                <div className="auctions-grid">
                {!loading && endedAuctions.map(auction => (
                    <AuctionCard key={auction.auction_id} auction={auction} />
                ))}
                </div>
            </>
        )}
      </div>
    </MainLayout>
  );
};

export default HomePage;