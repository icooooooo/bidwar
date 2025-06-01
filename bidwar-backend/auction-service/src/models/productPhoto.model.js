const mongoose = require('mongoose');

const productPhotoSchema = new mongoose.Schema({
    auction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    image_url: { type: String, required: true },
    upload_order: { type: Number, default: 0 }, // Pour ordonner l'affichage des photos
    is_primary: { type: Boolean, default: false }
}, { timestamps: true });

productPhotoSchema.index({ auction_id: 1 });

module.exports = mongoose.model('ProductPhoto', productPhotoSchema);