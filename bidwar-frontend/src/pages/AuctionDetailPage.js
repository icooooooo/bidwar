import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { fetchAuctionById, placeBid as apiPlaceBid } from '../services/auctionService';
import CountdownTimer from '../components/auctions/CountdownTimer';
import { useAuth } from '../hooks/useAuth';
import './AuctionDetailPage.css';

const AuctionDetailPage = () => {
  const { auctionId } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const { isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();

  const loadAuction = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAuctionById(auctionId);
      setAuction(data);
      // Pré-remplir le montant de l'enchère si possible
      if (data && data.current_price) {
          const nextMin = data.current_price + (data.current_price * 0.05 > 1 ? data.current_price * 0.05 : 1);
          setBidAmount(nextMin.toFixed(2));
      }
    } catch (err) {
      setError(err.message || "Impossible de charger les détails de l'enchère.");
    } finally {
      setLoading(false);
    }
  }, [auctionId]);


  useEffect(() => {
    loadAuction();
  }, [loadAuction]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
        setBidError("Veuillez vous connecter pour enchérir.");
        return;
    }
    if (user.id === auction?.seller_id) {
        setBidError("Vous ne pouvez pas enchérir sur votre propre objet.");
        return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= auction.current_price) {
        setBidError(`Votre enchère doit être supérieure à ${auction.current_price.toFixed(2)} €.`);
        return;
    }
    setBidError('');
    setBidLoading(true);
    try {
        await apiPlaceBid(auctionId, parseFloat(bidAmount), user, token);
        // Recharger les données de l'enchère pour voir la mise à jour
        loadAuction();
        alert("Enchère placée avec succès !");
    } catch (err) {
        setBidError(err.message || "Erreur lors de la tentative d'enchère.");
    } finally {
        setBidLoading(false);
    }
  };


  if (loading) return <MainLayout><div className="container loading-text">Chargement de l'enchère...</div></MainLayout>;
  if (error) return <MainLayout><div className="container error-message">{error} <button onClick={() => navigate('/')}>Retour</button></div></MainLayout>;
  if (!auction) return <MainLayout><div className="container">Enchère non trouvée. <Link to="/">Retour à l'accueil</Link></div></MainLayout>;

  const nextMinBid = auction.current_price + (auction.current_price * 0.05 > 1 ? auction.current_price * 0.05 : 1);

  return (
    <MainLayout>
      <div className="container auction-detail-page">
        <div className="auction-detail-header">
            <button onClick={() => navigate(-1)} className="back-button">← Retour</button>
            <h1>{auction.title}</h1>
        </div>

        <div className="auction-content-grid">
            <div className="auction-images">
                {auction.photos && auction.photos.length > 0 ? (
                    auction.photos.map((photo, index) => (
                        <img key={index} src={photo.image_url} alt={`${auction.title} - image ${index + 1}`} className="auction-image-item"/>
                    ))
                ) : (
                    <img src="https://via.placeholder.com/600x400?text=Image+Indisponible" alt="Image par défaut" className="auction-image-item"/>
                )}
            </div>

            <div className="auction-info card">
                <p className="auction-status-detail">Statut: <span className={`status-${auction.status?.toLowerCase().replace(' ', '_')}`}>{auction.status}</span></p>
                {auction.status === 'Active' && auction.end_time && (
                <div className="auction-timer-detail">
                    Temps restant: <CountdownTimer endTime={auction.end_time} />
                </div>
                )}
                <p className="current-price-detail">Prix actuel: <strong>{auction.current_price.toFixed(2)} €</strong></p>
                <p className="start-price-detail">Prix de départ: {auction.prix_depart.toFixed(2)} €</p>
                {auction.highest_bidder_username && <p>Meilleur enchérisseur: {auction.highest_bidder_username}</p>}
                <p>Vendu par: {auction.seller_username || `Vendeur ID ${auction.seller_id}`}</p>
                
                {auction.status === 'Active' && (
                    isAuthenticated ? (
                        user?.id !== auction.seller_id ? (
                            <form onSubmit={handleBidSubmit} className="bid-form">
                                <h3>Placer une enchère</h3>
                                {bidError && <p className="error-message" style={{fontSize: '0.85rem', padding: '0.5rem'}}>{bidError}</p>}
                                <div className="form-group">
                                    <label htmlFor="bidAmount">Votre enchère (min. {nextMinBid.toFixed(2)} €)</label>
                                    <input 
                                        type="number" 
                                        id="bidAmount"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder={`${nextMinBid.toFixed(2)}`}
                                        step="0.01"
                                        min={(auction.current_price + 0.01).toFixed(2)}
                                        required 
                                    />
                                </div>
                                <button type="submit" className="button-primary" disabled={bidLoading}>
                                    {bidLoading ? "Enchère en cours..." : "Enchérir"}
                                </button>
                            </form>
                        ) : (
                            <p className="seller-notice">Vous êtes le vendeur de cet objet.</p>
                        )
                    ) : (
                        <p>Veuillez vous <Link to="/login" state={{from: {pathname: `/auctions/${auctionId}`}}}>connecter</Link> ou vous <Link to="/register">inscrire</Link> pour enchérir.</p>
                    )
                 )}
                 {auction.status !== 'Active' && <p className="auction-ended-notice">Cette enchère est terminée.</p>}
            </div>
        </div>

        <div className="auction-description card">
            <h3>Description</h3>
            <p>{auction.description || "Aucune description fournie."}</p>
        </div>

        <div className="auction-bids-history card">
            <h3>Historique des enchères ({auction.bids?.length || 0})</h3>
            {auction.bids && auction.bids.length > 0 ? (
                <ul>
                    {auction.bids.slice().reverse().map((bid, index) => (
                        <li key={index}>
                           {bid.amount.toFixed(2)} € par <strong>{bid.username || `Utilisateur ${bid.user_id.substring(0,5)}...`}</strong> le {new Date(bid.timestamp).toLocaleString()}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Aucune enchère pour le moment.</p>
            )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AuctionDetailPage;