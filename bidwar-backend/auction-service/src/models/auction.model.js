const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    prix_depart: { type: Number, required: true, min: 0 },
    current_price: { type: Number, required: true, default: function() { return this.prix_depart; } },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Référence à l'utilisateur (vendeur)
    highest_bidder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
        type: String,
        enum: ['Pending Approval', 'Active', 'Scheduled', 'Ended', 'Sold', 'Cancelled', 'Rejected'],
        default: 'Pending Approval'
    },
    admin_approver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Admin qui approuve
    approval_timestamp: { type: Date, default: null },
    rejection_reason: { type: String, trim: true, default: null }, // Si rejetée
    physical_inspection_status: {
        type: String,
        enum: ['Not Required', 'Pending', 'Done', 'Failed'],
        default: 'Not Required'
    },
    // On ajoutera les photos plus tard, peut-être comme un sous-document ou une collection séparée
    // images: [{ url: String, upload_order: Number }],
    winner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Gagnant final
}, { timestamps: true }); // Ajoute createdAt et updatedAt

// Index pour les recherches courantes
auctionSchema.index({ status: 1, end_time: 1 });
auctionSchema.index({ seller_id: 1 });

module.exports = mongoose.model('Auction', auctionSchema);