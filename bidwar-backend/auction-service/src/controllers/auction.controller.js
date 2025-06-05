const Auction = require('../models/auction.model'); // Assurez-vous que le chemin est correct
const Bid = require('../models/bid.model');
const { publishToExchange } = require('../config/rabbitmqPublisher');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
// @desc    Créer une nouvelle enchère
// @route   POST /api/auctions
// @access  Privé (Vendeur seulement)
exports.createAuction = async (req, res) => {
    const errors = validationResult(req); // Assurez-vous que ceci est bien géré si vous n'avez pas de middleware validateRequest
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { titre, description, prix_depart, start_time, end_time } = req.body;

        // Le seller_id vient de req.auth.id attaché par le middleware protectAuctionRoutes
        const seller_id = req.auth.id;

        if (!titre || !description || prix_depart === undefined || !start_time || !end_time) {
            return res.status(400).json({ message: 'Veuillez fournir tous les champs requis (titre, description, prix_depart, start_time, end_time).' });
        }

        // Validation simple des dates (des validations plus robustes peuvent être ajoutées)
        if (new Date(start_time) >= new Date(end_time)) {
            return res.status(400).json({ message: 'La date de début doit être antérieure à la date de fin.' });
        }
        const now = new Date();
        let initialStatus;

        if (new Date(start_time) <= now) {
            // Si l'heure de début est maintenant ou déjà passée (pourrait être directement Active si pas d'approbation)
            initialStatus = 'Active';
        } else {
            // L'heure de début est dans le futur
            initialStatus = 'Scheduled'; // Pour que le scheduler activateScheduledAuctions la prenne
        }


        const auction = new Auction({
            titre,
            description,
            prix_depart,
            current_price: prix_depart,
            start_time: new Date(start_time),
            end_time: new Date(end_time),
            seller_id,
            status: 'Pending Approval', // TOUJOURS Pending Approval à la création
        });

        const createdAuction = await auction.save();
        const eventData = {
    auctionId: createdAuction._id.toString(),
    sellerId: seller_id.toString(),
    status: createdAuction.status,
    titre: createdAuction.titre,
    startTime: createdAuction.start_time,
    endTime: createdAuction.end_time,
    prixDepart: createdAuction.prix_depart
};
await publishToExchange('auction.created', eventData);
        res.status(201).json(createdAuction);

    } catch (error) {
        console.error('Erreur lors de la création de l\'enchère:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'enchère.' });
    }
};
exports.getAuctions = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10; // Valeur par défaut de 10 éléments par page
        const skip = (page - 1) * limit;

        // Construction de la requête de filtre
        const queryFilter = {};

        // Filtrer par statut (si fourni et valide)
        const validStatuses = ['Pending Approval', 'Active', 'Scheduled', 'Ended', 'Sold', 'Cancelled', 'Rejected'];
        if (req.query.status && validStatuses.includes(req.query.status)) {
            queryFilter.status = req.query.status;
        } else {
            // Par défaut, afficher uniquement celles qui sont pertinentes pour un visiteur
            queryFilter.status = { $in: ['Active', 'Scheduled'] };
        }

        // Filtrer par seller_id (si fourni)
        if (req.query.seller_id) {
            // Idéalement, valider que c'est un ObjectId valide
            if (mongoose.Types.ObjectId.isValid(req.query.seller_id)) {
                queryFilter.seller_id = req.query.seller_id;
            } else {
                // Si l'ID n'est pas valide, on ne renvoie rien pour ce filtre ou une erreur
                // Pour l'instant, on ignore un seller_id invalide, ou on pourrait renvoyer 400
            }
        }

        // (Plus tard, vous pourrez ajouter des filtres par catégorie, recherche par mots-clés, etc.)
        // Exemple pour une recherche textuelle simple (nécessite un index texte sur titre/description)
        // if (req.query.search) {
        //     queryFilter.$text = { $search: req.query.search };
        // }

        const auctions = await Auction.find(queryFilter)
            .sort({ start_time: 1 }) // Trier par date de début (ou createdAt: -1 pour les plus récentes)
            .skip(skip)
            .limit(limit)
            // .populate('seller_id', 'nom prenom'); // Toujours optionnel et dépendant de la structure DB

        const totalAuctions = await Auction.countDocuments(queryFilter);

        res.json({
            auctions,
            currentPage: page,
            totalPages: Math.ceil(totalAuctions / limit),
            totalCount: totalAuctions
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des enchères:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des enchères.' });
    }
};
exports.getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        // De même pour populate, à gérer avec prudence en microservices.

        if (auction) {
            res.json(auction);
        } else {
            res.status(404).json({ message: 'Enchère non trouvée.' });
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'enchère ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') { // Si l'ID n'est pas un ObjectId valide
            return res.status(400).json({ message: 'ID d\'enchère invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'enchère.' });
    }
};

exports.placeBid = async (req, res) => {
    // Gérer les erreurs de validation d'express-validator (si pas de middleware centralisé)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { auctionId } = req.params;
        const { bid_amount } = req.body;
        const bidder_id = req.auth.id; // Vient du middleware protectAuctionRoutes

        // 1. Trouver l'enchère
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ message: 'Enchère non trouvée.' });
        }
        const previousHighestBidderId = auction.highest_bidder_id;
        // 2. Vérifier le statut de l'enchère (doit être 'Active')
        if (auction.status !== 'Active') {
            return res.status(400).json({ message: `Vous ne pouvez pas enchérir sur cette enchère. Statut actuel: ${auction.status}` });
        }

        // 3. Vérifier si l'enchère est en cours (temps)
        const now = new Date();
        if (now < auction.start_time) {
            return res.status(400).json({ message: 'Cette enchère n\'a pas encore commencé.' });
        }
        if (now > auction.end_time) {
            return res.status(400).json({ message: 'Cette enchère est terminée.' });
        }

        // 4. Vérifier si le vendeur essaie d'enchérir sur son propre article
        if (auction.seller_id.toString() === bidder_id.toString()) {
            return res.status(400).json({ message: 'Vous ne pouvez pas enchérir sur votre propre article.' });
        }

        // 5. Vérifier si la nouvelle offre est supérieure au prix actuel
        if (bid_amount <= auction.current_price) {
            return res.status(400).json({ message: `Votre offre doit être supérieure au prix actuel de ${auction.current_price}.` });
        }

        // 6. Créer et sauvegarder la nouvelle offre
        const newBid = new Bid({
            auction_id: auctionId,
            bidder_id: bidder_id,
            bid_amount: bid_amount,
        });
        await newBid.save();

        // 7. Mettre à jour l'enchère avec la nouvelle offre
        auction.current_price = bid_amount;
        auction.highest_bidder_id = bidder_id;
        // Optionnel: ajouter la nouvelle offre à un tableau d'historique des offres dans le document Auction si vous le souhaitez
        // auction.bids_history.push(newBid._id); // Si vous avez un tel champ
        const updatedAuction = await auction.save();

        // (Plus tard : Logique de notification pour l'ancien meilleur enchérisseur, etc.)

        const newBidEvent = {
            auctionId: updatedAuction._id.toString(),
            auctionTitle: updatedAuction.titre,
            bidderId: bidder_id.toString(),
            amount: bid_amount,
            sellerId: updatedAuction.seller_id.toString()
        };
        await publishToExchange('bid.placed', newBidEvent);

// Pour l'offre dépassée
        if (previousHighestBidderId && previousHighestBidderId.toString() !== bidder_id.toString()) {
        const outbidEvent = {
            auctionId: updatedAuction._id.toString(),
            auctionTitle: updatedAuction.titre,
            outbidUserId: previousHighestBidderId.toString(),
            newBidderId: bidder_id.toString(),
            newAmount: bid_amount
        };
   await publishToExchange('bid.outbid', outbidEvent);
}
        if (previousHighestBidderId && previousHighestBidderId.toString() !== bidder_id.toString()) {
           console.log(`NOTIFICATION_EVENT: BID_OUTBID - AuctionID: ${updatedAuction._id}, OutbidUserID: ${previousHighestBidderId}, NewBidderID: ${bidder_id}, NewAmount: ${bid_amount}, Titre: ${updatedAuction.titre}`);
        }

        res.status(201).json({
            message: 'Offre placée avec succès!',
            bid: newBid,
            updatedAuction
        });

    } catch (error) {
        console.error('Erreur lors du placement de l\'offre:', error);
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'ID d\'enchère invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors du placement de l\'offre.' });
    }
};
exports.getBidsForAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;

        // 1. Optionnel : Vérifier si l'enchère existe
        //    Bien que si aucune offre n'est trouvée, cela implique qu'elle n'existe pas ou n'a pas d'offres.
        const auctionExists = await Auction.findById(auctionId);
        if (!auctionExists) {
            // Vous pouvez choisir de renvoyer 404 ici si l'enchère elle-même n'existe pas,
            // ou laisser find() sur Bid renvoyer un tableau vide.
            // Pour la cohérence, un 404 si l'enchère parente n'existe pas est bien.
            return res.status(404).json({ message: 'Enchère non trouvée.' });
        }

        // 2. Trouver toutes les offres pour cette auction_id
        // Trier par date d'offre, la plus récente en premier (ou la plus ancienne, selon la préférence)
        // ou par montant d'offre.
        const bids = await Bid.find({ auction_id: auctionId })
                            .sort({ bid_timestamp: -1 }) // Les plus récentes en premier
                            .populate('bidder_id', 'nom prenom email'); // Pour afficher des infos sur l'enchérisseur

        // Si vous ne voulez pas populer et juste renvoyer les IDs :
        // const bids = await Bid.find({ auction_id: auctionId }).sort({ bid_timestamp: -1 });

        res.json(bids);

    } catch (error) {
        console.error(`Erreur lors de la récupération des offres pour l'enchère ${req.params.auctionId}:`, error);
        if (error.kind === 'ObjectId') { // Si auctionId n'est pas un ObjectId valide
            return res.status(400).json({ message: 'ID d\'enchère invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des offres.' });
    }
};
exports.updateAuction = async (req, res) => {
    // Gérer les erreurs de validation d'express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Enchère non trouvée.' });
        }

        // Vérification des permissions :
        // Seul le vendeur propriétaire OU un admin peut modifier
        const isOwner = auction.seller_id.toString() === req.auth.id.toString();
        const isAdmin = req.auth.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Non autorisé à modifier cette enchère.' });
        }

        // Logique de modification :
        // Un vendeur ne devrait pouvoir modifier que si l'enchère n'est pas 'Active' ou 'Ended' ou 'Sold'
        // et qu'il n'y a pas encore d'offres. Un admin pourrait avoir plus de droits.
        if (isOwner && (auction.status === 'Active' || auction.status === 'Ended' || auction.status === 'Sold' || auction.status === 'Cancelled')) {
            // Vérifier s'il y a des offres si elle est Active
            const bidCount = await Bid.countDocuments({ auction_id: auction._id });
            if (bidCount > 0 && auction.status === 'Active') {
                 return res.status(400).json({ message: 'Impossible de modifier une enchère active avec des offres.' });
            }
            if (auction.status !== 'Pending Approval' && auction.status !== 'Scheduled') { // Un vendeur peut modifier si c'est en attente ou programmé
                 return res.status(400).json({ message: `Impossible de modifier une enchère avec le statut '${auction.status}'.` });
            }
        }


        // Champs modifiables (exemple)
        const { titre, description, prix_depart, start_time, end_time } = req.body;

        if (titre) auction.titre = titre;
        if (description) auction.description = description;

        // La modification du prix de départ est délicate si des offres existent ou si elle est active
        if (prix_depart !== undefined && (auction.status === 'Pending Approval' || auction.status === 'Scheduled')) {
            auction.prix_depart = prix_depart;
            auction.current_price = prix_depart; // Réinitialiser le prix actuel si le prix de départ change avant activation
        } else if (prix_depart !== undefined) {
            return res.status(400).json({ message: 'Le prix de départ ne peut être modifié que si l\'enchère est en attente ou programmée.' });
        }


        if (start_time) auction.start_time = new Date(start_time);
        if (end_time) auction.end_time = new Date(end_time);

        // Valider la cohérence des dates si elles sont modifiées
        if ((start_time || end_time) && new Date(auction.start_time) >= new Date(auction.end_time)) {
            return res.status(400).json({ message: 'La date de début doit être antérieure à la date de fin.' });
        }


        // Un admin pourrait modifier le statut (ex: annuler une enchère)
        if (isAdmin && req.body.status) {
            // Ajouter une validation pour les statuts autorisés
            if (validStatuses.includes(req.body.status)) { // validStatuses défini plus haut
                auction.status = req.body.status;
                if (req.body.status === 'Cancelled' && !auction.rejection_reason && req.body.rejection_reason) {
                    auction.rejection_reason = req.body.rejection_reason; // Si l'admin annule avec un motif
                }
            } else {
                return res.status(400).json({ message: `Statut '${req.body.status}' invalide.` });
            }
        }


        const updatedAuction = await auction.save();
        console.log(`NOTIFICATION_EVENT: AUCTION_UPDATED - AuctionID: ${updatedAuction._id}, UpdatedBy: ${req.auth.id}`);
        res.json(updatedAuction);

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'enchère:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID d\'enchère invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'enchère.' });
    }
};

exports.deleteAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Enchère non trouvée.' });
        }

        const isOwner = auction.seller_id.toString() === req.auth.id.toString();
        const isAdmin = req.auth.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Non autorisé à supprimer cette enchère.' });
        }

        // Logique de suppression :
        // Un vendeur ne devrait pouvoir supprimer que si l'enchère n'est pas 'Active' (ou avec des offres) / 'Ended' / 'Sold'
        if (isOwner && (auction.status === 'Active' || auction.status === 'Ended' || auction.status === 'Sold' || auction.status === 'Cancelled')) {
            const bidCount = await Bid.countDocuments({ auction_id: auction._id });
            if (bidCount > 0) {
                 return res.status(400).json({ message: 'Impossible de supprimer une enchère avec des offres.' });
            }
             return res.status(400).json({ message: `Impossible de supprimer une enchère avec le statut '${auction.status}'. Seules les enchères en 'Pending Approval' ou 'Scheduled' (sans offres) peuvent être supprimées par le vendeur.` });
        }

        // Avant de supprimer l'enchère, supprimer les offres associées
        await Bid.deleteMany({ auction_id: auction._id });
        // (Plus tard, supprimer les photos associées si elles sont dans une autre collection)

        await auction.deleteOne(); // Utiliser deleteOne() sur l'instance

        console.log(`NOTIFICATION_EVENT: AUCTION_DELETED - AuctionID: ${req.params.id}, DeletedBy: ${req.auth.id}`);
        res.json({ message: 'Enchère et offres associées supprimées avec succès.' });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'enchère:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID d\'enchère invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'enchère.' });
    }
};

exports.approveAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Enchère non trouvée.' });
        }

        if (auction.status !== 'Pending Approval') {
            return res.status(400).json({ message: `L'enchère n'est pas en attente d'approbation. Statut actuel: ${auction.status}` });
        }

        const now = new Date();
        if (new Date(auction.start_time) <= now) { // Comparer avec auction.start_time converti en Date si ce n'est pas déjà le cas
            auction.status = 'Active';
        } else {
            auction.status = 'Scheduled';
        }
        auction.admin_approver_id = req.auth.id; // ID de l'admin qui approuve (vient du middleware protectAuctionRoutes)
        auction.approval_timestamp = now;
        auction.rejection_reason = null; // Effacer une éventuelle raison de rejet précédente

        const approvedAuction = await auction.save();

        // CORRECTION ICI :
        const eventData = {
    auctionId: approvedAuction._id.toString(),
    adminId: req.auth.id.toString(),
    newStatus: approvedAuction.status,
    titre: approvedAuction.titre
};
await publishToExchange('auction.approved', eventData);
        res.json(approvedAuction);

    } catch (error) {
        console.error('Erreur lors de l\'approbation de l\'enchère:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID d\'enchère invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de l\'approbation de l\'enchère.' });
    }
};

// @desc    Rejeter une enchère par un Admin
// @route   PUT /api/auctions/:id/reject
// @access  Privé (Admin seulement)
exports.rejectAuction = async (req, res) => {
    const { reason } = req.body; // L'admin doit fournir une raison pour le rejet

    // S'assurer que express-validator est utilisé si vous avez des validations dans la route, ou valider ici.
    // Pour l'instant, on vérifie 'reason' manuellement.
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
        return res.status(400).json({ message: 'Une raison valide pour le rejet est requise.' });
    }

    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Enchère non trouvée.' });
        }

        // On peut rejeter une enchère en 'Pending Approval' ou même 'Scheduled' si besoin.
        if (auction.status !== 'Pending Approval' && auction.status !== 'Scheduled') {
            return res.status(400).json({ message: `Impossible de rejeter une enchère avec le statut '${auction.status}'. Seules les enchères en 'Pending Approval' ou 'Scheduled' peuvent être rejetées.` });
        }

        auction.status = 'Rejected';
        auction.admin_approver_id = req.auth.id; // ID de l'admin qui rejette
        auction.rejection_reason = reason.trim();
        auction.approval_timestamp = null; // Effacer une éventuelle approbation précédente

        const rejectedAuction = await auction.save();

        const eventData = {
    auctionId: rejectedAuction._id.toString(),
    adminId: req.auth.id.toString(),
    reason: rejectedAuction.rejection_reason,
    titre: rejectedAuction.titre
};
await publishToExchange('auction.rejected', eventData);
        res.json(rejectedAuction);

    } catch (error) {
        console.error('Erreur lors du rejet de l\'enchère:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID d\'enchère invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors du rejet de l\'enchère.' });
    }
};


