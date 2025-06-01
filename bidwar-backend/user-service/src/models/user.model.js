const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true,
    },
    prenom: {
        type: String,
        required: [true, 'Le prénom est requis'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "L'email est requis"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, "Veuillez utiliser une adresse email valide"],
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false, // Ne pas retourner le mot de passe par défaut lors des requêtes
    },
    role: {
        type: String,
        enum: ['Vendeur', 'Acheteur', 'Admin'],
        default: 'Acheteur',
    },
    adresse: {
        type: String,
        trim: true,
    },
    telephone: {
        type: String,
        trim: true,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    is_verified: { // Vérification par email ou admin
        type: Boolean,
        default: false,
    },
    registration_date: {
        type: Date,
        default: Date.now,
    },
    last_login: {
        type: Date,
    }
}, { timestamps: true }); // Ajoute createdAt et updatedAt

// Middleware Mongoose pour hasher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Méthode pour comparer le mot de passe entré avec le mot de passe hashé
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);