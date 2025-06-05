const amqp = require('amqplib');

let channel = null;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'; // Fallback
const EXCHANGE_NAME = 'bidwar_events'; // Nom de notre exchange principal
const NOTIFICATION_QUEUE = 'notifications_processing_queue'; // Nom de la file pour ce service

const connectRabbitMQ = async () => {
    if (channel) return channel; // Si déjà connecté, retourner le canal existant

    try {
        console.log(`NotificationService: Tentative de connexion à RabbitMQ sur ${RABBITMQ_URL}...`);
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('NotificationService: Connecté à RabbitMQ et canal créé.');

        // Déclarer un exchange de type 'direct' (ou 'topic' si plus de flexibilité de routage nécessaire)
        // Un exchange 'direct' route les messages aux files dont la clé de liaison (binding key)
        // correspond exactement à la clé de routage (routing key) du message.
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        console.log(`NotificationService: Exchange '${EXCHANGE_NAME}' déclaré/assuré.`);

        // Déclarer la file d'attente pour les notifications
        // durable: true signifie que la file survivra à un redémarrage du broker RabbitMQ
        await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
        console.log(`NotificationService: File d'attente '${NOTIFICATION_QUEUE}' déclarée/assurée.`);

        // Lier la file à l'exchange pour certains types d'événements (clés de routage)
        // Le 'binding key' est ce que ce consommateur veut écouter.
        // Nous allons lier pour plusieurs types d'événements.
        // Par exemple, si auction-service publie avec routingKey 'auction.event'
        // ou user-service avec 'user.event'
        // Pour un exchange 'direct', on lie avec la même clé.
        // Pour un 'topic', on pourrait utiliser des wildcards (ex: 'auction.*')
        // Pour l'instant, on peut lier plusieurs clés spécifiques.
        // Ou une clé générique si on veut tout traiter ici.
        // Pour l'instant, ne lions rien ici, on le fera dans le consommateur pour plus de flexibilité.
        // On pourrait aussi lier pour des clés spécifiques comme :
        // await channel.bindQueue(NOTIFICATION_QUEUE, EXCHANGE_NAME, 'auction.created');
        // await channel.bindQueue(NOTIFICATION_QUEUE, EXCHANGE_NAME, 'bid.placed');
        // await channel.bindQueue(NOTIFICATION_QUEUE, EXCHANGE_NAME, 'user.registered');

        connection.on('error', (err) => {
            console.error('NotificationService: Erreur de connexion RabbitMQ:', err.message);
            channel = null; // Réinitialiser pour tenter de se reconnecter
            setTimeout(connectRabbitMQ, 5000); // Réessayer de se connecter après 5s
        });
        connection.on('close', () => {
            console.warn('NotificationService: Connexion RabbitMQ fermée. Tentative de reconnexion...');
            channel = null;
            setTimeout(connectRabbitMQ, 5000);
        });

        return channel;
    } catch (error) {
        console.error('NotificationService: Échec de la connexion initiale à RabbitMQ:', error.message);
        console.error('NotificationService: Nouvelle tentative dans 5 secondes...');
        setTimeout(connectRabbitMQ, 5000); // Réessayer après 5 secondes
        return null; // Important de retourner null en cas d'échec pour que le reste ne plante pas
    }
};

const getChannel = () => {
    if (!channel) {
        console.warn("NotificationService: Canal RabbitMQ non disponible. Tentative de reconnexion nécessaire.");
        // Idéalement, connectRabbitMQ devrait être appelé au démarrage de l'app et gérer les reconnexions.
    }
    return channel;
};


module.exports = { connectRabbitMQ, getChannel, EXCHANGE_NAME, NOTIFICATION_QUEUE };