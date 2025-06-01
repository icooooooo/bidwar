import React from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import './AuctionCard.css';

const getFirstImage = (photos) => photos && photos.length > 0 ? photos[0].image_url : 'https://via.placeholder.com/300x200?text=Image+Indisponible';

const AuctionCard = ({ auction }) => {
  if (!auction) return null;

  return (
    <div className="auction-card card">
      <Link to={`/auctions/${auction.auction_id}`} className="auction-card-link">
        <div className="auction-card-image-container">
          <img
            src={getFirstImage(auction.photos)}
            alt={auction.title}
            className="auction-card-image"
          />
        </div>
        <div className="auction-card-content">
          <h3 className="auction-card-title" title={auction.title}>{auction.title}</h3>
          <p className="auction-card-price">
            Actuel: <strong>${auction.current_price.toFixed(2)}</strong>
          </p>
          <p className="auction-card-start-price">
            Départ: ${auction.start_price.toFixed(2)}
          </p>
          {auction.status === 'Active' && auction.end_time && (
            <div className="auction-card-timer">
              <CountdownTimer endTime={auction.end_time} />
            </div>
          )}
          <p className={`auction-card-status status-${auction.status?.toLowerCase()}`}>{auction.status}</p>
        </div>
      </Link>
      {auction.status === 'Active' && (
        <div className="auction-card-actions">
            <Link to={`/auctions/${auction.auction_id}`} className="button-primary bid-button">Voir & Enchérir</Link>
        </div>
      )}
    </div>
  );
};

export default AuctionCard;