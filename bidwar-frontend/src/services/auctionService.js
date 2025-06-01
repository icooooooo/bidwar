// src/services/auctionService.js
const mockAuctionsData = [
  { auction_id: '1', title: 'Montre Vintage de Collection Extraordinaire', description: "Une superbe montre des années 60, en parfait état de marche. Un must-have pour les collectionneurs.", current_price: 150.00, start_price: 50.00, end_time: new Date(Date.now() + 3600000 * 2).toISOString(), status: 'Active', photos: [{image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}, {image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}], seller_id: '2', highest_bidder_id: 'temp2', bids: [{user_id: 'temp1', username: 'BidderOne', amount: 100, timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString()}, {user_id: 'temp2', username: 'BidderTwo', amount: 150, timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString()}] },
  { auction_id: '2', title: 'Tableau Ancien Signé - Huile sur Toile', description: "Oeuvre d'un artiste méconnu du 19ème siècle. Paysage bucolique. Cadre d'origine.", current_price: 320.00, start_price: 100.00, end_time: new Date(Date.now() + 3600000 * 5).toISOString(), status: 'Active', photos: [{image_url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}], seller_id: '2', highest_bidder_id: null, bids: [] },
  { auction_id: '3', title: 'Série de Pièces de Monnaie Rares', description: "Collection de pièces de monnaie de différents pays et époques. Certaines très rares.", current_price: 75.00, start_price: 20.00, end_time: new Date(Date.now() - 3600000 * 1).toISOString(), status: 'Ended', photos: [{image_url: 'https://images.unsplash.com/photo-1580130379629-3e90753960a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}], seller_id: '1', highest_bidder_id: 'temp_winner', bids: [] },
];
let auctions = [...mockAuctionsData];

export const fetchAllAuctions = async () => { // Pourrait être utilisé par l'admin
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...auctions]); // Retourne une copie
    }, 500);
  });
};

export const fetchAuctionById = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const auction = auctions.find(auc => auc.auction_id === id);
      if (auction) {
        resolve({...auction}); // Retourne une copie
      } else {
        reject(new Error('Enchère non trouvée'));
      }
    }, 500);
  });
};

export const createAuction = async (auctionData, token, sellerId, sellerUsername) => {
    return new Promise((resolve, reject) => {
        if (!token) {
            reject(new Error("Non autorisé"));
            return;
        }
        setTimeout(() => {
            const newAuction = {
                ...auctionData,
                auction_id: String(Date.now()), // Utilise timestamp pour ID unique pour le mock
                status: 'Pending Approval', // Comme défini dans le cahier des charges
                current_price: auctionData.start_price,
                bids: [],
                seller_id: sellerId, // Vient de l'utilisateur authentifié
                seller_username: sellerUsername, // Pourrait être utile
                creation_date: new Date().toISOString(),
            };
            auctions.unshift(newAuction); // Ajoute au début pour le voir facilement
            resolve({...newAuction});
        }, 1000);
    });
};

export const placeBid = async (auctionId, amount, user, token) => {
     return new Promise((resolve, reject) => {
        if (!token || !user) {
            reject(new Error("Non autorisé pour enchérir"));
            return;
        }
        setTimeout(() => {
            const auctionIndex = auctions.findIndex(auc => auc.auction_id === auctionId);
            if (auctionIndex === -1) {
                reject(new Error("Enchère non trouvée"));
                return;
            }
            const currentAuction = auctions[auctionIndex];
            if (currentAuction.status !== 'Active') {
                reject(new Error("Cette enchère n'est plus active"));
                return;
            }
            if (user.id === currentAuction.seller_id) {
                reject(new Error("Le vendeur ne peut pas enchérir sur son propre objet."));
                return;
            }
            if (amount <= currentAuction.current_price) {
                reject(new Error(`Votre enchère doit être supérieure à ${currentAuction.current_price.toFixed(2)} €.`));
                return;
            }
            
            const updatedAuction = {
                ...currentAuction,
                current_price: parseFloat(amount),
                highest_bidder_id: user.id,
                highest_bidder_username: user.username,
                bids: [...currentAuction.bids, { user_id: user.id, username: user.username, amount: parseFloat(amount), timestamp: new Date().toISOString() }]
            };
            auctions[auctionIndex] = updatedAuction;
            resolve({...updatedAuction});
        }, 700);
    });
};