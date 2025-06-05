const { getChannel, NOTIFICATION_QUEUE, EXCHANGE_NAME } = require('../config/rabbitmq');

// Les clés de routage que ce service de notification veut écouter
const BINDING_KEYS = [
    'auction.created',
    'auction.approved',
    'auction.rejected',
    'auction.activated',
    'auction.ended.winner',
    'auction.ended.nobids',
    'bid.placed',
    'bid.outbid',
    'user.registered', // Exemple si user-service envoie aussi
    // Ajoutez d'autres clés au besoin
];

const startConsumingNotifications = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error('NotificationHandler: Impossible de démarrer la consommation, canal RabbitMQ non disponible.');
        // Une logique de nouvelle tentative pourrait être mise ici, ou gérée par le connectRabbitMQ
        // Pour l'instant, on attend que connectRabbitMQ réussisse au démarrage.
        return;
    }

    try {
        console.log(`NotificationHandler: Assurer la file d'attente '${NOTIFICATION_QUEUE}' et l'exchange '${EXCHANGE_NAME}'.`);
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });

        console.log('NotificationHandler: Liaison de la file aux clés de routage...');
        for (const key of BINDING_KEYS) {
            await channel.bindQueue(NOTIFICATION_QUEUE, EXCHANGE_NAME, key);
            console.log(`NotificationHandler: File '${NOTIFICATION_QUEUE}' liée à l'exchange '${EXCHANGE_NAME}' avec la clé '${key}'.`);
        }

        console.log(`NotificationHandler: En attente de messages sur la file '${NOTIFICATION_QUEUE}'. Pour quitter, CTRL+C`);

        channel.consume(NOTIFICATION_QUEUE, (msg) => {
            if (msg !== null) {
                try {
                    const messageContent = msg.content.toString();
                    const routingKey = msg.fields.routingKey;
                    console.log(`NotificationHandler: [${routingKey}] Message reçu: ${messageContent}`);
                    
                    const eventData = JSON.parse(messageContent);

                    // TODO: Implémenter la logique d'envoi de notification ici
                    // En fonction de routingKey et eventData
                    // Exemple :
                    // if (routingKey === 'bid.placed') {
                    //   sendNewBidEmail(eventData.bidderEmail, eventData.auctionTitle, eventData.bidAmount);
                    // } else if (routingKey === 'auction.ended.winner') {
                    //   sendAuctionWonEmail(eventData.winnerEmail, eventData.auctionTitle, eventData.finalPrice);
                    // }
                    // ... etc.

                    channel.ack(msg); // Confirmer que le message a été traité
                } catch (parseError) {
                    console.error('NotificationHandler: Erreur de parsing du message JSON:', parseError, msg.content.toString());
                    channel.nack(msg, false, false); // Rejeter le message sans le remettre en file (pour éviter boucle infinie sur message malformé)
                }
            }
        }, {
            noAck: false // Important: nous allons acquitter manuellement avec channel.ack() ou channel.nack()
        });
    } catch (error) {
        console.error('NotificationHandler: Erreur lors de la configuration du consommateur RabbitMQ:', error);
    }
};

module.exports = { startConsumingNotifications };