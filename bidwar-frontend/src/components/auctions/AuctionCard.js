import React from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer'; // Assurez-vous que ce composant existe et fonctionne
import './AuctionCard.css';                 // Assurez-vous que ce fichier CSS existe et est importé

// MODIFIÉ : Utilisation d'un placeholder local
const getFirstImage = (photos) => {
  if (Array.isArray(photos) && photos.length > 0 && photos[0] && typeof photos[0].image_url === 'string' && photos[0].image_url.trim() !== '') {
    return photos[0].image_url;
  }
  // Assurez-vous d'avoir une image placeholder dans public/images/placeholder-auction.png
  return `${process.env.PUBLIC_URL}/images/placeholder-auction.png`;
};

const AuctionCard = ({ auction }) => {
  // Log pour déboguer les données reçues par chaque carte
  console.log("AuctionCard REÇOIT auction:", JSON.stringify(auction, null, 2));

  if (!auction) {
    console.warn("AuctionCard: Reçu une 'auction' null ou undefined. Ne rend rien.");
    return null; // Ne rien rendre si pas de données d'enchère
  }

  // Préparer l'affichage des prix avec vérification
  const currentPriceDisplay = (typeof auction.current_price === 'number')
                              ? `${auction.current_price.toFixed(2)} €` // Ou votre devise
                              : 'Prix non disponible';

  const startPriceDisplay = (typeof auction.prix_depart === 'number') // Utilise prix_depart
                            ? `${auction.prix_depart.toFixed(2)} €`   // Utilise prix_depart
                            : 'N/D'; // Non disponible

  // Utiliser _id de préférence, sinon auction_id comme fallback. Crucial pour la key et les Link.
  const auctionIdForLink = auction._id || auction.auction_id;

  if (!auctionIdForLink) {
    console.error("AuctionCard: Enchère reçue sans _id ou auction_id valide!", auction);
    // Vous pourriez vouloir rendre une carte d'erreur ici
    return <div className="auction-card card error-card">Erreur: Données d'enchère invalides (ID manquant)</div>;
  }
  
  // Vérifier si end_time est une date valide avant de la passer à CountdownTimer
  const isValidEndTime = auction.end_time && !isNaN(new Date(auction.end_time).getTime());

  return (
    <div className="auction-card card">
      <Link to={`/auctions/${auctionIdForLink}`} className="auction-card-link">
        <div className="auction-card-image-container">
          <img
            src={getFirstImage(auction.photos)} // 'photos' doit être un tableau d'objets avec image_url
            alt={auction.titre || 'Image de l\'enchère'} // Fallback pour alt text
            className="auction-card-image"
          />
        </div>
        <div className="auction-card-content">
          <h3 className="auction-card-title" title={auction.titre || undefined}>
            {auction.titre || 'Titre non disponible'} {/* Fallback pour le titre */}
          </h3>
          <p className="auction-card-price">
            Actuel: <strong>{currentPriceDisplay}</strong>
          </p>
          <p className="auction-card-start-price">
            Départ: {startPriceDisplay}
          </p>
          {auction.status === 'Active' && isValidEndTime && ( // Ajout de la vérification isValidEndTime
            <div className="auction-card-timer">
              <CountdownTimer endTime={auction.end_time} />
            </div>
          )}
          <p className={`auction-card-status status-${auction.status?.toLowerCase().replace(' ', '-') || 'inconnu'}`}>
            {auction.status || 'Statut inconnu'} {/* Fallback pour le statut */}
          </p>
        </div>
      </Link>
      {auction.status === 'Active' && (
        <div className="auction-card-actions">
            <Link to={`/auctions/${auctionIdForLink}`} className="button-primary bid-button">Voir & Enchérir</Link>
        </div>
      )}
    </div>
  );
};

export default AuctionCard;