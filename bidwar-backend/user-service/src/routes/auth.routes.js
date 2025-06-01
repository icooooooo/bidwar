const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/auth.controller');
const validateRequest = require('../middlewares/requestValidator.middleware');

/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Endpoints pour l'enregistrement et la connexion des utilisateurs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPayload' # Référence au schéma défini globalement
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès et token JWT retourné.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données d'entrée invalides (validation échouée) ou utilisateur existant déjà.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors: # Si c'est une erreur de validation express-validator
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type: { type: 'string' }
 *                       value: { type: 'string' }
 *                       msg: { type: 'string' }
 *                       path: { type: 'string' }
 *                       location: { type: 'string' }
 *                 message: # Si c'est une autre erreur 400 (ex: utilisateur existe)
 *                   type: string
 *                   example: Cet utilisateur existe déjà
 *       500:
 *         description: Erreur serveur.
 */
router.post(
    '/register',
    [
        body('nom').notEmpty().withMessage('Le nom est requis'),
        body('prenom').notEmpty().withMessage('Le prénom est requis'),
        body('email').isEmail().withMessage('Veuillez fournir un email valide'),
        body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
        // Vous pouvez ajouter d'autres validations pour role, adresse, telephone si besoin
        // Pour documenter 'role' dans Swagger, il est déjà dans RegisterPayload
    ],
    validateRequest, // Appliquer notre middleware de validation
    registerUser
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connecter un utilisateur existant
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Connexion réussie, token JWT retourné.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données d'entrée invalides (validation échouée).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object # (similaire à la réponse d'erreur de /register)
 *       401:
 *         description: Email ou mot de passe invalide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email ou mot de passe invalide
 *       500:
 *         description: Erreur serveur.
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Veuillez fournir un email valide'),
        body('password').notEmpty().withMessage('Le mot de passe est requis'),
    ],
    validateRequest,
    loginUser
);

module.exports = router;