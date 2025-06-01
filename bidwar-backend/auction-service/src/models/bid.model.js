const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    auction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    bidder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bid_amount: { type: Number, required: true },
    bid_timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

bidSchema.index({ auction_id: 1, bid_amount: -1 }); // Pour trouver rapidement la plus haute offre pour une enchère
bidSchema.index({ bidder_id: 1, auction_id: 1 });

module.exports = mongoose.model('Bid', bidSchema);