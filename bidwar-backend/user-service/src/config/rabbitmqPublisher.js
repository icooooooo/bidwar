const amqp = require('amqplib');

// La variable d'environnement RABBITMQ_URL est passée par docker-compose.yml
// et prend sa valeur de RABBITMQ_URL_ENV dans le .env racine.
const RABBITMQ_URL = process.env.RABBITMQ_URL; // Assurez-vous que user-service reçoit cette variable
const EXCHANGE_NAME = 'bidwar_events'; // Doit être le même que celui utilisé par les autres services
let channel = null;
let connection = null;

const connectPublisher = async () => {
    // Si le canal et la connexion existent et que la connexion est active, on peut essayer de l'utiliser.
    // Une vérification plus robuste consisterait à s'assurer que le canal est toujours valide.
    if (channel && connection && connection.isConnected) {
        try {
            // Test rapide pour voir si le canal est toujours bon (optionnel mais peut aider)
            await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
            return channel;
        } catch (checkError) {
            console.warn('UserService Publisher: Test du canal RabbitMQ échoué, tentative de reconnexion.', checkError.message);
            channel = null; // Forcer la réinitialisation
            if (connection) {
                try { await connection.close(); } catch (e) { /* ignorer les erreurs de fermeture */ }
                connection = null;
            }
        }
    }

    if (!RABBITMQ_URL) {
        console.error("UserService Publisher: FATAL ERROR - RABBITMQ_URL n'est pas défini.");
        return null; // Ne pas tenter de se reconnecter en boucle si la config de base est manquante
    }

    try {
        console.log(`UserService Publisher: Tentative de connexion à RabbitMQ sur ${RABBITMQ_URL}...`);
        connection = await amqp.connect(RABBITMQ_URL); // Établir une nouvelle connexion
        channel = await connection.createChannel();    // Créer un nouveau canal
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        console.log(`UserService Publisher: Connecté et exchange '${EXCHANGE_NAME}' assuré.`);

        // Gestionnaires d'événements pour la connexion
        connection.on('error', (err) => {
            console.error('UserService Publisher: Erreur de connexion RabbitMQ:', err.message);
            channel = null; connection = null; // Réinitialiser pour la reconnexion
            setTimeout(connectPublisher, 5000); // Réessayer de se connecter après 5s
        });
        connection.on('close', () => {
            console.warn('UserService Publisher: Connexion RabbitMQ fermée. Tentative de reconnexion...');
            channel = null; connection = null; // Réinitialiser pour la reconnexion
            setTimeout(connectPublisher, 5000);
        });

        return channel;
    } catch (error) {
        console.error('UserService Publisher: Échec connexion initiale RabbitMQ:', error.message);
        connection = null; channel = null; // Assurer la réinitialisation
        setTimeout(connectPublisher, 5000); // Réessayer après 5 secondes
        return null;
    }
};

const publishToExchange = async (routingKey, message) => {
    let currentChannel = getChannel();
    if (!currentChannel) {
        console.warn('UserService Publisher: Canal non disponible, tentative de reconnexion avant publication...');
        currentChannel = await connectPublisher(); // Essayer de se reconnecter
        if (!currentChannel) {
            console.error(`UserService Publisher: Échec de la reconnexion, message non publié pour la clé '${routingKey}'.`);
            return false;
        }
    }

    try {
        // console.log(`UserService Publisher: Publication vers exchange '${EXCHANGE_NAME}', clé '${routingKey}':`, message);
        currentChannel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
        console.log(`UserService Publisher: Message publié avec succès vers exchange '${EXCHANGE_NAME}', clé '${routingKey}'.`);
        return true;
    } catch (error) {
        console.error(`UserService Publisher: Erreur de publication RabbitMQ pour la clé '${routingKey}':`, error);
        if (error.message.includes('Channel closed') || error.message.includes('Connection closed')) {
            channel = null; // Forcer la reconnexion
            connection = null;
            console.warn('UserService Publisher: Canal ou connexion fermé, tentative de reconnexion...');
            await connectPublisher(); // Tenter de se reconnecter immédiatement
        }
        return false;
    }
};

// Fonction pour obtenir le canal, en s'assurant qu'il est initialisé.
const getChannel = () => {
    // `connection.isConnected` n'est pas une propriété standard de la connexion amqplib.
    // La validité du canal est mieux gérée par les tentatives de reconnexion et les erreurs.
    if (!channel) {
        return null;
    }
    return channel;
};


// Tenter la connexion initiale au démarrage du module.
// Les erreurs sont gérées à l'intérieur pour permettre au service de démarrer même si RabbitMQ n'est pas immédiatement prêt.
connectPublisher().then(ch => {
    if (ch) {
        console.log("UserService Publisher: Connexion RabbitMQ initiale réussie au démarrage du module.");
    } else {
        console.warn("UserService Publisher: Connexion RabbitMQ initiale échouée au démarrage du module. Des tentatives de reconnexion suivront.");
    }
});

module.exports = { publishToExchange };