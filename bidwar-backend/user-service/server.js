const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes.js');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
// const userRoutes = require('./src/routes/user.routes'); // On l'ajoutera plus tard

// Charger les variables d'environnement depuis le fichier .env à la racine de user-service
dotenv.config();
// Connexion à la base de données
connectDB();
const app = express();
// Middleware pour parser le JSON
app.use(express.json());
app.use('/api/users', userRoutes);


const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User Service API - BidWar',
            version: '1.0.0',
            description: 'API pour la gestion des utilisateurs et l\'authentification du projet BidWar',
            contact: {
                name: 'Votre Nom/Equipe',
                email: 'votre.email@example.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.USER_SERVICE_PORT_CONTAINER || 3001}/api`, // Ajustez si nécessaire
                description: 'Serveur de développement User Service',
            },
        ],
        components: { // Pour définir des schémas réutilisables, la sécurité, etc.
            schemas: {
                RegisterPayload: { // NOUVEAU SCHÉMA
                    type: 'object',
                    required: ['nom', 'prenom', 'email', 'password'],
                    properties: {
                        nom: { type: 'string', example: 'Doe' },
                        prenom: { type: 'string', example: 'John' },
                        email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                        password: { type: 'string', format: 'password', example: 'password123' },
                        role: { type: 'string', enum: ['Vendeur', 'Acheteur', 'Admin'], default: 'Acheteur', example: 'Acheteur' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60c72b2f9b1e8c1a2c8e4d5e' },
                        nom: { type: 'string', example: 'Doe' },
                        prenom: { type: 'string', example: 'John' },
                        email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                        role: { type: 'string', enum: ['Vendeur', 'Acheteur', 'Admin'], example: 'Acheteur' },
                        // Ajoutez d'autres propriétés pertinentes que vous retournez
                    }
                },
                LoginCredentials: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', format: 'password' }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        // Propriétés de l'utilisateur (peut utiliser $ref: '#/components/schemas/User')
                        _id: { type: 'string' },
                        nom: { type: 'string' },
                        prenom: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string' },
                        token: { type: 'string', description: 'JWT Token' }
                    }
                }
                // Ajoutez d'autres schémas pour RegisterPayload, UserProfileUpdatePayload etc.
            },
            securitySchemes: { // Pour définir comment l'authentification fonctionne
                bearerAuth: { // Nommez-le comme vous voulez
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [ // Appliquer la sécurité globalement ou par opération
            {
                bearerAuth: [] // Applique bearerAuth à toutes les opérations qui le spécifient
            }
        ]
    },
    // Chemin vers les fichiers API (vos fichiers de routes) pour que swagger-jsdoc scanne les commentaires
    apis: ['./src/routes/*.js'], // Adaptez ce chemin si vos routes sont ailleurs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs/user-service', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Routes
app.get('/', (req, res) => { // Route de test simple
    res.send('User Service API is running...');
});
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes); // On l'activera plus tard

// Middleware de gestion d'erreurs (exemple simple, à améliorer)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Quelque chose s\'est mal passé!');
});

app.get('/api/auctions/health', (req, res) => {
    console.log('>>>> AUCTION SERVICE HEALTH CHECK HIT <<<<');
    res.status(200).send('Auction Service is Healthy and Running!');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});