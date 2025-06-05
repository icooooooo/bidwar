import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuctions } from '../../api'; // Assurez-vous que le chemin est correct
import AuctionCard from './AuctionCard';
import './AuctionList.css';

const AuctionList = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalAuctions, setTotalAuctions] = useState(0);
    const limitPerPage = 6;

    console.log("AuctionList - Composant rendu. État initial: loading =", loading, "error =", error, "auctions =", auctions.length); // LOG INITIAL

    const loadAuctions = useCallback(async (pageToLoad) => {
        console.log(`AuctionList - loadAuctions appelé pour la page: ${pageToLoad}`); // LOG B
        try {
            setLoading(true);
            setError('');
            console.log("AuctionList - AVANT appel fetchAuctions"); // LOG C
            const response = await fetchAuctions({
                page: pageToLoad,
                limit: limitPerPage,
            });
            console.log("AuctionList - APRES appel fetchAuctions, Réponse API reçue:", response ? response.data : 'Pas de réponse'); // LOG D

            if (response && response.data && response.data.auctions) {
                setAuctions(response.data.auctions);
                setCurrentPage(response.data.currentPage);
                setTotalPages(response.data.totalPages);
                setTotalAuctions(response.data.totalCount);
                console.log("AuctionList - États mis à jour avec les données API"); // LOG G
            } else {
                setAuctions([]);
                setTotalPages(0);
                setTotalAuctions(0);
                console.warn("AuctionList - Réponse API pour fetchAuctions inattendue ou vide:", response ? response.data : 'Pas de réponse'); // LOG H
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Impossible de charger les enchères.';
            setError(errorMessage);
            console.error("AuctionList - Erreur DANS loadAuctions:", err.response || err.message || err); // LOG E
        } finally {
            setLoading(false);
            console.log("AuctionList - loadAuctions terminé, setLoading(false)"); // LOG F
        }
    }, [limitPerPage]);

    useEffect(() => {
        console.log("AuctionList - useEffect déclenché pour currentPage:", currentPage); // LOG A
        loadAuctions(currentPage);
    }, [currentPage, loadAuctions]);

    console.log("AuctionList - Avant return: loading =", loading, "error =", error, "auctions =", auctions.length); // LOG AVANT RETURN

    if (loading && auctions.length === 0) {
        console.log("AuctionList - Rendu: Message de chargement");
        return <p className="loading-message">Chargement des enchères...</p>;
    }
    if (error) {
        console.log("AuctionList - Rendu: Message d'erreur:", error);
        return <p className="error-message">{error}</p>;
    }
    if (auctions.length === 0 && !loading) {
        console.log("AuctionList - Rendu: Message 'Aucune enchère'");
        return <p className="no-auctions-message">Aucune enchère disponible pour le moment.</p>;
    }

    console.log("AuctionList - Contenu final du tableau 'auctions' AVANT MAP:", JSON.stringify(auctions, null, 2));
    return (
        <div className="auction-list-container">
            <h2>Enchères Disponibles <span className="auction-count">({totalAuctions} au total)</span></h2>
            {auctions.length > 0 && ( // S'assurer qu'on ne mappe pas sur un tableau vide inutilement pour la grille
                <>
                    <div className="auctions-grid">
                        {auctions.map(auction => (
                            <AuctionCard key={auction._id} auction={auction} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage <= 1 || loading}>
                                Précédent
                            </button>
                            <span> Page {currentPage} sur {totalPages} </span>
                            <button onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages || loading}>
                                Suivant
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuctionList;