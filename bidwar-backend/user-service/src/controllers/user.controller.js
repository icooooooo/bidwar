const User = require('../models/user.model'); // Assurez-vous que le chemin vers user.model.js est correct

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/users/me
// @access  Privé (nécessite authentification)
exports.getUserProfile = async (req, res) => {
    // req.user est attaché par le middleware 'protect'
    if (req.user) {
        res.json({
            _id: req.user._id,
            nom: req.user.nom,
            prenom: req.user.prenom,
            email: req.user.email,
            role: req.user.role,
            adresse: req.user.adresse,
            telephone: req.user.telephone,
            is_active: req.user.is_active,
            is_verified: req.user.is_verified,
            registration_date: req.user.registration_date,
            last_login: req.user.last_login
        });
    } else {
        // Normalement, le middleware 'protect' devrait déjà avoir renvoyé une erreur 401
        // si req.user n'est pas défini. Ceci est une sécurité supplémentaire.
        // Mais si on arrive ici sans req.user, c'est plus une erreur serveur ou un bug dans 'protect'.
        // Un 404 pour "utilisateur non trouvé" pourrait être approprié si l'ID du token ne correspond à aucun user.
        // Cependant, 'protect' devrait déjà gérer le cas où l'utilisateur n'est pas trouvé après décodage du token.
        // Si 'protect' a bien fonctionné et passé, req.user DOIT être là.
        // Donc, si on arrive ici sans req.user, c'est une situation anormale.
        console.error("Contrôleur getUserProfile atteint sans req.user, ce qui ne devrait pas arriver après le middleware 'protect'.");
        res.status(500).json({ message: 'Erreur serveur : informations utilisateur manquantes après authentification.' });
    }
};

// @desc    Mettre à jour le profil de l'utilisateur connecté
// @route   PUT /api/users/me
// @access  Privé
exports.updateUserProfile = async (req, res) => {
    try {
        // req.user._id vient du middleware protect
        // On récupère l'utilisateur frais depuis la DB pour s'assurer qu'on a la dernière version
        const user = await User.findById(req.user._id); 

        if (user) {
            user.nom = req.body.nom || user.nom;
            user.prenom = req.body.prenom || user.prenom;
            
            // Gérer la mise à jour de l'email avec précaution (vérification d'unicité si elle change)
            if (req.body.email && req.body.email !== user.email) {
                const emailExists = await User.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte.' });
                }
                user.email = req.body.email;
            }

            user.adresse = req.body.adresse !== undefined ? req.body.adresse : user.adresse; // Permet de mettre à null/vide
            user.telephone = req.body.telephone !== undefined ? req.body.telephone : user.telephone; // Permet de mettre à null/vide

            // Si le mot de passe est fourni dans la requête, le mettre à jour
            if (req.body.password) {
                if (req.body.password.length < 6) {
                     return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
                }
                user.password = req.body.password; // Le pre-save hook s'occupera du hashage
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                nom: updatedUser.nom,
                prenom: updatedUser.prenom,
                email: updatedUser.email,
                role: updatedUser.role,
                adresse: updatedUser.adresse,
                telephone: updatedUser.telephone,
            });
        } else {
            // Ce cas ne devrait pas arriver si le token est valide et que 'protect' a trouvé l'utilisateur.
            res.status(404).json({ message: 'Utilisateur non trouvé pour la mise à jour.' });
        }
    } catch (error) {
        console.error('Erreur de mise à jour du profil:', error);
        if (error.code === 11000 || (error.message && error.message.includes('duplicate key error'))) {
             return res.status(400).json({ message: 'Erreur de duplication, cet email est peut-être déjà utilisé.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil', error: error.message });
    }
};