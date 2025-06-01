const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé' });
            }
            next();
        } catch (error) {
            console.error('Erreur d\'authentification du token:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Non autorisé, token invalide' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Non autorisé, token expiré' });
            }
            return res.status(401).json({ message: 'Non autorisé, échec du token' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Non autorisé, pas de token fourni' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `L'utilisateur avec le rôle '${req.user ? req.user.role : 'inconnu'}' n'est pas autorisé à accéder à cette ressource` });
        }
        next();
    };
};

module.exports = { protect, authorize };