const jwt = require('jsonwebtoken');

// Cette variable d'environnement doit être le secret utilisé par user-service pour signer les tokens.
// Nous la nommerons USER_JWT_SECRET dans l'environnement du auction-service.
const JWT_SECRET_FOR_VERIFICATION = process.env.USER_JWT_SECRET;

const protectAuctionRoutes = async (req, res, next) => {
    let token;

    if (!JWT_SECRET_FOR_VERIFICATION) {
        console.error('FATAL ERROR: USER_JWT_SECRET is not defined for auction-service.');
        return res.status(500).json({ message: 'Configuration serveur incorrecte (secret manquant).' });
    }

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET_FOR_VERIFICATION);

            // Attacher les informations décodées à req.auth (ou req.user si vous préférez)
            req.auth = { id: decoded.id, role: decoded.role };

            if (!req.auth.id || !req.auth.role) {
                return res.status(401).json({ message: 'Non autorisé, informations utilisateur invalides dans le token' });
            }
            next();
        } catch (error) {
            console.error('Auction Service - Erreur d\'authentification du token:', error.message);
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
        return res.status(401).json({ message: 'Non autorisé, pas de token fourni' });
    }
};

const authorizeAuctionAction = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.auth || !req.auth.role || !allowedRoles.includes(req.auth.role)) {
            return res.status(403).json({ message: `Accès refusé. Rôle(s) requis: ${allowedRoles.join(' ou ')}.` });
        }
        next();
    };
};

module.exports = { protectAuctionRoutes, authorizeAuctionAction };