import React from 'react';
import AuctionList from '../components/auctions/AuctionList'; // Ajustez ce chemin si votre AuctionList est ailleurs

const AuctionsPage = () => {
    return (
        <div className="auctions-page-container"> {/* Optionnel: pour du style global de la page */}
            <h1>Toutes les Enchères</h1>
            <AuctionList />
        </div>
    );
};

export default AuctionsPage;