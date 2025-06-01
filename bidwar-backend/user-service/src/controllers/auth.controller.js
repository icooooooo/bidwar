const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../../.env' }); // Ajustez le chemin si nécessaire

// Fonction pour générer un token JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { // process.env.JWT_SECRET est lu depuis l'env du user-service
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
            role,
            adresse,
            telephone
        });

        if (user) {
        res.status(201).json({
            _id: user._id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role), // MODIFIÉ : Passer user.role
        });
    } else {
            res.status(400).json({ message: 'Données utilisateur invalides' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement', error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password'); // On doit explicitement demander le password

        if (user && (await user.matchPassword(password))) {
            user.last_login = Date.now();
            await user.save({ validateBeforeSave: false }); // Pas besoin de re-valider pour juste last_login

            res.json({
            _id: user._id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role), // MODIFIÉ : Passer user.role
        });
    } else {
            res.status(401).json({ message: 'Email ou mot de passe invalide' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: error.message });
    }
};