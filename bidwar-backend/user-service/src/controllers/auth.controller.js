const User = require('../models/user.model');
// MODIFIÉ : Chemin d'import corrigé pour rabbitmqPublisher
const { publishToExchange } = require('../config/rabbitmqPublisher');
const jwt = require('jsonwebtoken');

// dotenv est généralement chargé une seule fois au démarrage de l'application (dans server.js)
// Si vous le chargez ici, assurez-vous que le chemin est correct par rapport à CE fichier.
// Pour un service Docker, les variables d'environnement sont injectées par docker-compose.
// require('dotenv').config({ path: '../../.env' }); // Chemin si .env est à la racine de user-service
// Il est préférable de s'appuyer sur les variables injectées par Docker Compose.

// Fonction pour générer un token JWT
const generateToken = (id, role) => {
    // process.env.JWT_SECRET est lu depuis l'environnement du conteneur user-service
    // (défini via la variable JWT_SECRET_USERS dans le .env racine et passé dans docker-compose.yml)
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    const { nom, prenom, email, password, role, adresse, telephone } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
        }

        const user = await User.create({
            nom,
            prenom,
            email,
            password, // Sera hashé par le middleware pre-save de Mongoose
            role: role || 'Acheteur', // Rôle par défaut si non fourni
            adresse,
            telephone
        });

        if (user) {
            // Publier l'événement d'enregistrement utilisateur
            const eventData = {
                userId: user._id.toString(),
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role
                // Ajoutez d'autres infos si utiles pour l'email de bienvenue
            };
            // Le 'await' ici est optionnel. La publication est asynchrone "fire and forget".
            // Si vous voulez gérer les erreurs de publication, vous pouvez l'utiliser.
            try {
                await publishToExchange('user.registered', eventData);
            } catch (publishError) {
                // Logguer l'erreur de publication mais ne pas faire échouer l'enregistrement utilisateur
                console.error("Erreur lors de la publication de l'événement user.registered:", publishError);
            }

            res.status(201).json({
                _id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            // Ce cas est moins probable avec User.create s'il n'y a pas d'erreur avant.
            res.status(400).json({ message: 'Données utilisateur invalides lors de la création.' });
        }
    } catch (error) {
        console.error('Erreur serveur lors de l\'enregistrement:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
        }
        res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.', 
            errorDetails: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe invalide' });
        }
        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            user.last_login = Date.now();
            await user.save({ validateBeforeSave: false });
            res.json({
                _id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Email ou mot de passe invalide' });
        }
    } catch (error) {
        console.error('Erreur serveur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.',
            errorDetails: error.message });
    }
};