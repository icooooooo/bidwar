const express = require('express');
const router = express.Router();
const {
    createAuction,
    getAuctions,
    getAuctionById,
    placeBid,
    getBidsForAuction,
    updateAuction,
    deleteAuction,
    approveAuction,
    rejectAuction
} = require('../controllers/auction.controller');
const { protectAuctionRoutes, authorizeAuctionAction } = require('../middlewares/auth.middleware');
const { body, validationResult } = require('express-validator'); // validationResult est nécessaire pour le middleware inline

/**
 * @swagger
 * tags:
 *   name: Enchères
 *   description: Gestion des produits mis aux enchères et des offres
 */

// --- ROUTES POUR LES ENCHÈRES ---

/**
 * @swagger
 * /auctions:
 *   post:
 *     summary: Créer une nouvelle enchère
 *     tags: [Enchères]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewAuctionPayload'
 *     responses:
 *       '201':
 *         description: 'Enchère créée (statut initial Pending Approval).'
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Auction' } } }
 *       '400':
 *         description: 'Données invalides'
 *         content: { application/json: { schema: { type: 'object', properties: { errors: { type: 'array', items: { type: 'object' } } } } } }
 *       '401':
 *         description: 'Non authentifié'
 *       '403':
 *         description: 'Non autorisé (rôle incorrect)'
 *       '500':
 *         description: 'Erreur serveur'
 */
router.post(
    '/',
    protectAuctionRoutes,
    authorizeAuctionAction('Vendeur'),
    [
        body('titre').notEmpty().withMessage('Le titre est requis.'),
        body('description').notEmpty().withMessage('La description est requise.'),
        body('prix_depart').isFloat({ gt: 0 }).withMessage('Le prix de départ doit être un nombre positif.'),
        body('start_time').isISO8601().toDate().withMessage('La date de début doit être une date valide.'),
        body('end_time').isISO8601().toDate().withMessage('La date de fin doit être une date valide.')
    ],
    (req, res, next) => { // Middleware inline pour valider
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    createAuction
);

/**
 * @swagger
 * /auctions:
 *   get:
 *     summary: Lister les enchères avec filtres et pagination
 *     tags: [Enchères]
 *     parameters:
 *       - {in: query, name: page, schema: { type: 'integer', default: 1 }, description: 'Numéro de la page'}
 *       - {in: query, name: limit, schema: { type: 'integer', default: 10 }, description: 'Nombre d''éléments par page'}
 *       - {in: query, name: status, schema: { type: 'string', enum: ['Pending Approval', 'Active', 'Scheduled', 'Ended', 'Sold', 'Cancelled', 'Rejected'] }, description: 'Filtrer par statut'}
 *       - {in: query, name: seller_id, schema: { type: 'string' }, description: 'Filtrer par ID du vendeur'}
 *     responses:
 *       '200':
 *         description: 'Liste des enchères.'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auctions: { type: 'array', items: { $ref: '#/components/schemas/Auction' } }
 *                 currentPage: { type: 'integer' }
 *                 totalPages: { type: 'integer' }
 *                 totalCount: { type: 'integer' }
 *       '500':
 *         description: 'Erreur serveur'
 */
router.get('/', getAuctions);

/**
 * @swagger
 * /auctions/{id}:
 *   get:
 *     summary: "Obtenir les détails d'une enchère spécifique"
 *     tags: [Enchères]
 *     parameters:
 *       - {in: path, name: id, required: true, schema: { type: 'string' }, description: "ID de l'enchère"}
 *     responses:
 *       '200':
 *         description: "Détails de l'enchère."
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Auction' } } }
 *       '400': { description: 'ID invalide' }
 *       '404': { description: 'Enchère non trouvée' }
 *       '500': { description: 'Erreur serveur' }
 */
router.get('/:id', getAuctionById);

/**
 * @swagger
 * /auctions/{id}:
 *   put:
 *     summary: 'Mettre à jour une enchère (Vendeur propriétaire ou Admin)'
 *     tags: [Enchères]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - {in: path, name: id, required: true, schema: { type: 'string' }, description: "ID de l'enchère à mettre à jour"}
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAuctionPayload'
 *     responses:
 *       '200':
 *         description: 'Enchère mise à jour.'
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Auction' } } }
 *       '400':
 *         description: 'Données invalides ou modification non permise'
 *         content: { application/json: { schema: { type: 'object', properties: { errors: { type: 'array', items: { type: 'object' } } } } } }
 *       '401': { description: 'Non authentifié' }
 *       '403': { description: 'Non autorisé' }
 *       '404': { description: 'Enchère non trouvée' }
 *       '500': { description: 'Erreur serveur' }
 */
router.put(
    '/:id',
    protectAuctionRoutes,
    [
        body('titre').optional().notEmpty().withMessage('Le titre ne peut pas être vide.'),
        body('description').optional().notEmpty().withMessage('La description ne peut pas être vide.'),
        body('prix_depart').optional().isFloat({ gt: 0 }).withMessage('Le prix de départ doit être un nombre positif.'),
        body('start_time').optional().isISO8601().toDate().withMessage('La date de début doit être une date valide.'),
        body('end_time').optional().isISO8601().toDate().withMessage('La date de fin doit être une date valide.'),
        body('status').optional().isIn(['Pending Approval', 'Active', 'Scheduled', 'Ended', 'Sold', 'Cancelled', 'Rejected']).withMessage('Statut invalide.')
    ],
    (req, res, next) => { // Middleware inline pour valider
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    updateAuction
);

/**
 * @swagger
 * /auctions/{id}:
 *   delete:
 *     summary: 'Supprimer une enchère (Vendeur propriétaire ou Admin)'
 *     tags: [Enchères]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - {in: path, name: id, required: true, schema: { type: 'string' }, description: "ID de l'enchère à supprimer"}
 *     responses:
 *       '200': { description: 'Enchère supprimée avec succès' }
 *       '400': { description: "Suppression non permise (ex: enchère active avec offres)" }
 *       '401': { description: 'Non authentifié' }
 *       '403': { description: 'Non autorisé' }
 *       '404': { description: 'Enchère non trouvée' }
 *       '500': { description: 'Erreur serveur' }
 */
router.delete(
    '/:id',
    protectAuctionRoutes,
    deleteAuction
);


// --- ROUTES POUR LES OFFRES (BIDS) ---

/**
 * @swagger
 * /auctions/{auctionId}/bids:
 *   post:
 *     summary: 'Placer une offre sur une enchère'
 *     tags: [Enchères]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - {in: path, name: auctionId, required: true, schema: { type: 'string' }, description: "ID de l'enchère"}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewBidPayload'
 *     responses:
 *       '201':
 *         description: 'Offre placée.'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: 'string' }
 *                 bid: { $ref: '#/components/schemas/Bid' }
 *                 updatedAuction: { $ref: '#/components/schemas/Auction' }
 *       '400':
 *         description: 'Données invalides ou offre non permise'
 *         content: { application/json: { schema: { type: 'object', properties: { errors: { type: 'array', items: { type: 'object' } } } } } }
 *       '401': { description: 'Non authentifié' }
 *       '403': { description: 'Non autorisé (rôle incorrect)' }
 *       '404': { description: 'Enchère non trouvée' }
 *       '500': { description: 'Erreur serveur' }
 */
router.post(
    '/:auctionId/bids',
    protectAuctionRoutes,
    authorizeAuctionAction('Acheteur'),
    [
        body('bid_amount').isFloat({ gt: 0 }).withMessage('Le montant de l\'offre doit être un nombre positif.')
    ],
    (req, res, next) => { // Middleware inline pour valider
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    placeBid
);

/**
 * @swagger
 * /auctions/{auctionId}/bids:
 *   get:
 *     summary: "Lister toutes les offres pour une enchère spécifique"
 *     tags: [Enchères]
 *     parameters:
 *       - {in: path, name: auctionId, required: true, schema: { type: 'string' }, description: "ID de l'enchère"}
 *     responses:
 *       '200':
 *         description: 'Liste des offres.'
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Bid' }
 *       '400': { description: "ID d'enchère invalide" }
 *       '404': { description: 'Enchère non trouvée' }
 *       '500': { description: 'Erreur serveur' }
 */
router.get(
    '/:auctionId/bids',
    getBidsForAuction
);


// --- ROUTES ADMIN POUR ENCHÈRES ---

/**
 * @swagger
 * /auctions/{id}/approve:
 *   put:
 *     summary: 'Approuver une enchère (Admin)'
 *     tags: [Enchères, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - {in: path, name: id, required: true, schema: { type: 'string' }, description: "ID de l'enchère à approuver"}
 *     responses:
 *       '200':
 *         description: 'Enchère approuvée.'
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Auction' } } }
 *       '400': { description: "L'enchère n'est pas en attente d'approbation ou ID invalide" }
 *       '401': { description: 'Non authentifié' }
 *       '403': { description: 'Non autorisé (rôle non Admin)' }
 *       '404': { description: 'Enchère non trouvée' }
 *       '500': { description: 'Erreur serveur' }
 */
router.put(
    '/:id/approve',
    protectAuctionRoutes,
    authorizeAuctionAction('Admin'),
    approveAuction
);

/**
 * @swagger
 * /auctions/{id}/reject:
 *   put:
 *     summary: 'Rejeter une enchère (Admin)'
 *     tags: [Enchères, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - {in: path, name: id, required: true, schema: { type: 'string' }, description: "ID de l'enchère à rejeter"}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApproveRejectPayload'
 *     responses:
 *       '200':
 *         description: 'Enchère rejetée.'
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Auction' } } }
 *       '400':
 *         description: 'Raison manquante, enchère ne peut être rejetée ou ID invalide'
 *         content: { application/json: { schema: { type: 'object', properties: { errors: { type: 'array', items: { type: 'object' } } } } } }
 *       '401': { description: 'Non authentifié' }
 *       '403': { description: 'Non autorisé (rôle non Admin)' }
 *       '404': { description: 'Enchère non trouvée' }
 *       '500': { description: 'Erreur serveur' }
 */
router.put(
    '/:id/reject',
    protectAuctionRoutes,
    authorizeAuctionAction('Admin'),
    [
        body('reason').notEmpty().trim().withMessage('Une raison pour le rejet est requise et ne peut pas être vide.')
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    rejectAuction
);

module.exports = router;