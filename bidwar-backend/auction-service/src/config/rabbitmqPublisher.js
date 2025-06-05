const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const EXCHANGE_NAME = 'bidwar_events'; // Doit être le même que celui utilisé par notification-service
let channel = null;
let connection = null; // Garder une référence à la connexion pour la gestion des erreurs

const connectPublisher = async () => {
    if (channel && connection && connection.isConnected) { // Vérifier si la connexion est toujours valide
        try {
            // Test rapide pour voir si le canal est toujours bon
            await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
            return channel;
        } catch (checkError) {
            console.warn('AuctionService Publisher: Test du canal RabbitMQ échoué, tentative de reconnexion.', checkError.message);
            channel = null;
            if (connection) {
                try { await connection.close(); } catch (e) { /* ignorer */ }
                connection = null;
            }
        }
    }
    
    if (!RABBITMQ_URL) {
        console.error("AuctionService Publisher: FATAL ERROR - RABBITMQ_URL n'est pas défini.");
        // Ne pas tenter de se reconnecter en boucle si la config de base est manquante
        return null;
    }

    try {
        console.log(`AuctionService Publisher: Tentative de connexion à RabbitMQ sur ${RABBITMQ_URL}...`);
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        console.log(`AuctionService Publisher: Connecté et exchange '${EXCHANGE_NAME}' assuré.`);

        connection.on('error', (err) => {
            console.error('AuctionService Publisher: Erreur de connexion RabbitMQ:', err.message);
            channel = null; connection = null;
            setTimeout(connectPublisher, 7000); // Délai un peu plus long pour le publisher
        });
        connection.on('close', () => {
            console.warn('AuctionService Publisher: Connexion RabbitMQ fermée. Tentative de reconnexion...');
            channel = null; connection = null;
            setTimeout(connectPublisher, 7000);
        });
        return channel;
    } catch (error) {
        console.error('AuctionService Publisher: Échec connexion initiale RabbitMQ:', error.message);
        connection = null; channel = null; // Assurer la réinitialisation
        setTimeout(connectPublisher, 7000);
        return null;
    }
};

const publishToExchange = async (routingKey, message) => {
    let currentChannel = getChannel(); // Utiliser getChannel pour potentiellement relancer la connexion
    if (!currentChannel) {
        console.warn('AuctionService Publisher: Canal non disponible, tentative de reconnexion avant publication...');
        currentChannel = await connectPublisher(); // Essayer de se reconnecter
        if (!currentChannel) {
            console.error(`AuctionService Publisher: Échec de la reconnexion, message non publié pour la clé '${routingKey}'.`);
            return false; // Échec de la publication
        }
    }
    
    try {
        // console.log(`AuctionService Publisher: Publication vers exchange '${EXCHANGE_NAME}', clé '${routingKey}':`, message);
        currentChannel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
        console.log(`AuctionService Publisher: Message publié avec succès vers exchange '${EXCHANGE_NAME}', clé '${routingKey}'.`);
        return true;
    } catch (error) {
        console.error(`AuctionService Publisher: Erreur de publication RabbitMQ pour la clé '${routingKey}':`, error);
        if (error.message.includes('Channel closed') || error.message.includes('Connection closed')) {
            channel = null; // Forcer la reconnexion
            connection = null;
            console.warn('AuctionService Publisher: Canal ou connexion fermé, tentative de reconnexion...');
            await connectPublisher(); // Tenter de se reconnecter immédiatement
        }
        return false; // Échec de la publication
    }
};

// Fonction pour obtenir le canal, en s'assurant qu'il est initialisé.
const getChannel = () => {
    if (!channel || (connection && !connection.isConnected)) { // Ajout de la vérification connection.isConnected
        // Si le canal n'est pas prêt, la connexion initiale via connectPublisher() devrait être en cours
        // ou une tentative de reconnexion. Pour l'instant, on retourne null si pas prêt.
        // Les appels à publishToExchange tenteront de le recréer.
        return null;
    }
    return channel;
};

// Connexion initiale au démarrage du service.
// Les erreurs sont gérées à l'intérieur pour permettre au service de démarrer même si RabbitMQ n'est pas immédiatement prêt.
connectPublisher().then(ch => {
    if (ch) {
        console.log("AuctionService Publisher: Connexion RabbitMQ initiale réussie au démarrage du module.");
    } else {
        console.warn("AuctionService Publisher: Connexion RabbitMQ initiale échouée au démarrage du module. Des tentatives de reconnexion suivront.");
    }
});

module.exports = { publishToExchange };