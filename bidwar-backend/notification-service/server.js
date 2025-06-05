const express = require('express'); // Optionnel, pour un endpoint de santé
const dotenv = require('dotenv');
const { connectRabbitMQ } = require('./src/config/rabbitmq');
const { startConsumingNotifications } = require('./src/services/notificationHandler');

dotenv.config({ path: './.env' });

const app = express(); // Optionnel

// Endpoint de santé optionnel
app.get('/api/notifications/health', (req, res) => {
    res.send('Notification Service is running healthy!');
});

const PORT = process.env.PORT_NOTIFICATION || 3003;

const startServer = async () => {
    const rabbitChannel = await connectRabbitMQ(); // Tenter la connexion initiale

    if (rabbitChannel) { // Démarrer la consommation seulement si la connexion initiale est OK
        await startConsumingNotifications();
    } else {
        console.error("NotificationService: Démarrage du serveur sans connexion RabbitMQ. Le service ne consommera pas de messages tant que la connexion n'est pas rétablie.");
        // La logique de reconnexion est dans connectRabbitMQ
    }
    
    // Démarrer le serveur Express (si vous l'utilisez)
    app.listen(PORT, () => {
        console.log(`Notification Service (HTTP Health) running on port ${PORT}`);
    });
};

startServer();