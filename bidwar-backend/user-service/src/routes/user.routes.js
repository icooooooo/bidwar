const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.jwt.middleware');


router.get(
    '/me',
    protect, // On utilise le middleware 'protect' ici
    getUserProfile
);

router.put(
    '/me',
    protect, // Et ici aussi
    // ... validations ...
    updateUserProfile
);

module.exports = router;