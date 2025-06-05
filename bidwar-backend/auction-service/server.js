const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');
const connectDB = require('./src/config/db');
const auctionRoutes = require('./src/routes/auction.routes.js');
const Auction = require('./src/models/auction.model');
const { publishToExchange } = require('./src/config/rabbitmqPublisher'); // Import du publisher

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config({ path: './.env' });

connectDB(); // Connexion à MongoDB
// La connexion RabbitMQ pour le publisher est initiée dans rabbitmqPublisher.js lors de son import

const app = express();
app.use(express.json());

// --- SWAGGER CONFIGURATION ---
const auctionSwaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Auction Service API - BidWar',
            version: '1.0.0',
            description: 'API pour la gestion des enchères et des offres du projet BidWar',
            contact: { name: 'Votre Nom/Equipe', email: 'votre.email@example.com' },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT_AUCTION || 3002}/api`,
                description: 'Serveur de développement Auction Service',
            },
        ],
        components: {
            schemas: { // Assurez-vous que ces schémas sont bien définis et complets
                Auction: { type: 'object', properties: { /* ... */ } },
                NewAuctionPayload: { type: 'object', properties: { /* ... */ } },
                Bid: { type: 'object', properties: { /* ... */ } },
                NewBidPayload: { type: 'object', properties: { /* ... */ } },
                ApproveRejectPayload: { type: 'object', properties: { /* ... */ } },
                UpdateAuctionPayload: { type: 'object', properties: { /* ... */ } } // Ajoutez celui-ci si ce n'est pas fait
            },
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        security: [ { bearerAuth: [] } ]
    },
    apis: ['./src/routes/auction.routes.js'],
};
const auctionSwaggerSpec = swaggerJsdoc(auctionSwaggerOptions);
app.use('/api-docs/auction-service', swaggerUi.serve, swaggerUi.setup(auctionSwaggerSpec));
// --- FIN SWAGGER CONFIGURATION ---


app.get('/api/auctions/health', (req, res) => {
    console.log('Auction service health check endpoint was hit!');
    res.status(200).send('Auction Service is Up and Running!');
});

app.use('/api/auctions', auctionRoutes);


// --- LOGIQUE DU SCHEDULER ---
const activateScheduledAuctions = async () => {
    console.log('Scheduler: Vérification des enchères à activer...');
    try {
        const now = new Date();
        const auctionsToActivate = await Auction.find({
            status: 'Scheduled',
            start_time: { $lte: now }
        });

        if (auctionsToActivate.length > 0) {
            console.log(`Scheduler: ${auctionsToActivate.length} enchère(s) à activer trouvée(s).`);
            for (const auction of auctionsToActivate) {
                auction.status = 'Active';
                await auction.save();
                console.log(`Scheduler: Enchère ${auction._id} (${auction.titre}) activée.`);
                const eventData = {
                    auctionId: auction._id.toString(),
                    sellerId: auction.seller_id.toString(),
                    titre: auction.titre
                };
                await publishToExchange('auction.activated', eventData); // PUBLICATION
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
        const auctionsToEnd = await Auction.find({
            status: 'Active',
            end_time: { $lte: now }
        });

        if (auctionsToEnd.length > 0) {
            console.log(`Scheduler: ${auctionsToEnd.length} enchère(s) active(s) terminée(s) trouvée(s).`);
            for (const auction of auctionsToEnd) {
                auction.status = 'Ended';
                let eventData = {
                    auctionId: auction._id.toString(),
                    sellerId: auction.seller_id.toString(),
                    titre: auction.titre,
                    finalPrice: auction.current_price
                };

                if (auction.highest_bidder_id) {
                    auction.winner_id = auction.highest_bidder_id;
                    console.log(`Scheduler: Enchère ${auction._id} (${auction.titre}) terminée. Gagnant: ${auction.winner_id}. Prix final: ${auction.current_price}`);
                    eventData.winnerId = auction.winner_id.toString();
                    await publishToExchange('auction.ended.winner', eventData); // PUBLICATION
                } else {
                    console.log(`Scheduler: Enchère ${auction._id} (${auction.titre}) terminée sans offres (pas de gagnant).`);
                    await publishToExchange('auction.ended.nobids', eventData); // PUBLICATION
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

// Planifier les tâches
if (process.env.NODE_ENV !== 'test') { // Pour ne pas lancer le cron pendant les tests unitaires/intégration par exemple
    cron.schedule('*/1 * * * *', async () => { // Toutes les minutes
        console.log('--- Scheduler Tick ---');
        await activateScheduledAuctions();
        await endActiveAuctions();
    });
    console.log("Auction Scheduler initialisé pour s'exécuter toutes les minutes.");
} else {
    console.log("Auction Scheduler non initialisé (NODE_ENV=test).");
}
// --- FIN LOGIQUE DU SCHEDULER ---

const PORT = process.env.PORT_AUCTION || 3002;
app.listen(PORT, () => {
    console.log(`Auction Service running on port ${PORT}`);
    // La ligne initAuctionScheduler(); n'est plus nécessaire ici si cron.schedule est appelé directement
});