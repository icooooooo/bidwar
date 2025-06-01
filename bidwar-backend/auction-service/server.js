
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const cron = require('node-cron');
const auctionRoutes = require('./src/routes/auction.routes'); 
const { initAuctionScheduler } = require('./src/services/auctionScheduler.service');
const Auction = require('./src/models/auction.model');
// const bidRoutes = require('./src/routes/bid.routes');  *     // À venir
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config({ path: './.env' }); // Spécifier le chemin du .env local au service

connectDB();
const app = express();
app.use(express.json());

const auctionSwaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Auction Service API - BidWar',
            version: '1.0.0',
            description: 'API pour la gestion des enchères et des offres du projet BidWar',
            contact: { /* ... vos infos ... */ },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT_AUCTION || 3002}/api`, // Port de auction-service
                description: 'Serveur de développement Auction Service',
            },
        ],
        components: {
            schemas: {
                Auction: { // Schéma pour une enchère
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '61c72b2f9b1e8c1a2c8e4d5e' },
                        titre: { type: 'string', example: 'Vélo Vintage' },
                        description: { type: 'string', example: 'Un vélo rare de collection.' },
                        prix_depart: { type: 'number', format: 'float', example: 150.00 },
                        current_price: { type: 'number', format: 'float', example: 175.50 },
                        start_time: { type: 'string', format: 'date-time', example: '2025-01-01T10:00:00Z' },
                        end_time: { type: 'string', format: 'date-time', example: '2025-01-07T10:00:00Z' },
                        seller_id: { type: 'string', description: 'ID du vendeur', example: 'userId123' },
                        status: { type: 'string', enum: ['Pending Approval', 'Active', 'Scheduled', 'Ended', 'Sold', 'Cancelled', 'Rejected'], example: 'Active' },
                        // Ajoutez d'autres champs pertinents (highest_bidder_id, winner_id, etc.)
                    }
                },
                NewAuctionPayload: { // Pour la création d'enchère
                    type: 'object',
                    required: ['titre', 'description', 'prix_depart', 'start_time', 'end_time'],
                    properties: {
                        titre: { type: 'string' },
                        description: { type: 'string' },
                        prix_depart: { type: 'number', format: 'float' },
                        start_time: { type: 'string', format: 'date-time' },
                        end_time: { type: 'string', format: 'date-time' },
                    }
                },
                Bid: { // Schéma pour une offre
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        auction_id: { type: 'string' },
                        bidder_id: { type: 'string' }, // ou un objet si vous peuplez
                        bid_amount: { type: 'number', format: 'float' },
                        bid_timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                NewBidPayload: { // Pour placer une offre
                    type: 'object',
                    required: ['bid_amount'],
                    properties: {
                        bid_amount: { type: 'number', format: 'float' }
                    }
                },
                ApproveRejectPayload: { // Pour approuver/rejeter par admin
                    type: 'object',
                    properties: {
                       reason: {type: 'string', description: 'Raison du rejet (optionnel pour approbation)'}
                    }
                }
                // Ajoutez d'autres schémas si nécessaire
            },
            securitySchemes: { // Le même que pour user-service
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [ { bearerAuth: [] } ] // Appliquer globalement si la plupart des routes sont protégées
    },
    apis: ['./src/routes/auction.routes.js'], // Pointer vers votre fichier de routes
};

const auctionSwaggerSpec = swaggerJsdoc(auctionSwaggerOptions);
app.use('/api-docs/auction-service', swaggerUi.serve, swaggerUi.setup(auctionSwaggerSpec));

app.get('/api/auctions/health', (req, res) => { // Route de test de santé
    res.send('Auction Service is running healthy!');
});

app.use('/api/auctions', auctionRoutes);
// app.use('/api/bids', bidRoutes); // Ou peut-être '/api/auctions/:auctionId/bids'

const PORT = process.env.PORT_AUCTION || 3002;
app.listen(PORT, () => {
    console.log(`Auction Service running on port ${PORT}`);
    initAuctionScheduler();
});
const activateScheduledAuctions = async () => {
    console.log('Scheduler: Vérification des enchères à activer...');
    try {
        const now = new Date();
        const auctionsToActivate = await Auction.find({
            status: 'Scheduled', // Ou 'Pending Approval' si vous voulez les activer directement sans étape 'Scheduled'
            start_time: { $lte: now } // start_time est inférieur ou égal à maintenant
        });

        if (auctionsToActivate.length > 0) {
            console.log(`Scheduler: ${auctionsToActivate.length} enchère(s) à activer trouvée(s).`);
            for (const auction of auctionsToActivate) {
                auction.status = 'Active';
                await auction.save();
                console.log(`Scheduler: Enchère ${auction._id} (${auction.titre}) activée.`);
                // TODO: Publier un événement "AUCTION_ACTIVATED" pour les notifications/WebSockets
            }
        } else {
            console.log('Scheduler: Aucune enchère programmée à activer.');
        }
    } catch (error) {
        console.error('Scheduler Error (activateScheduledAuctions):', error);
    }
};
const endActiveAuctions = async () => {
    console.log('Scheduler: Vérification des enchères terminées...');
    try {
        const now = new Date();
        // Chercher les enchères actives dont l'heure de fin est passée
        const auctionsToEnd = await Auction.find({
            status: 'Active',
            end_time: { $lte: now } // end_time est inférieur ou égal à maintenant
        });

        if (auctionsToEnd.length > 0) {
            console.log(`Scheduler: ${auctionsToEnd.length} enchère(s) active(s) terminée(s) trouvée(s).`);
            for (const auction of auctionsToEnd) {
                auction.status = 'Ended';
                // Déterminer le gagnant
                if (auction.highest_bidder_id) {
                    auction.winner_id = auction.highest_bidder_id;
                    console.log(`Scheduler: Enchère ${auction._id} (${auction.titre}) terminée. Gagnant: ${auction.winner_id}. Prix final: ${auction.current_price}`);
                    // TODO: Publier un événement "AUCTION_ENDED_WITH_WINNER"
                } else {
                    console.log(`Scheduler: Enchère ${auction._id} (${auction.titre}) terminée sans offres (pas de gagnant).`);
                    // TODO: Publier un événement "AUCTION_ENDED_NO_BIDS"
                }
                await auction.save();
            }
        } else {
            console.log('Scheduler: Aucune enchère active terminée à traiter.');
        }
    } catch (error) {
        console.error('Scheduler Error (endActiveAuctions):', error);
    }
};

// Planifier les tâches pour qu'elles s'exécutent toutes les minutes
// La syntaxe cron '*/1 * * * *' signifie "toutes les 1 minutes"
// Pour des tests plus rapides, vous pourriez utiliser '*/10 * * * * *' (toutes les 10 secondes) mais attention aux logs
cron.schedule('*/1 * * * *', async () => {
    console.log('--- Scheduler Tick ---');
    await activateScheduledAuctions();
    await endActiveAuctions();
});

console.log("Auction Scheduler initialisé pour s'exécuter toutes les minutes."); // Ce log que vous aviez déjà

// --- FIN LOGIQUE DU SCHEDULER ---

// const PORT = process.env.PORT_AUCTION || 3002;
// app.listen(PORT, () => {
//     console.log(`Auction Service running on port ${PORT}`);