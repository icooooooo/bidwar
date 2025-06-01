const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI_AUCTIONS || process.env.MONGO_URI; // Fallback au cas où
        if (!mongoURI) {
            console.error('FATAL ERROR: MONGO_URI_AUCTIONS (or MONGO_URI) is not defined for Auction Service.');
            process.exit(1);
        }
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected to Auction Service DB...');

        mongoose.connection.on('connected', () => console.log('Mongoose (Auction Svc): connected'));
        mongoose.connection.on('error', (err) => console.error('Mongoose (Auction Svc): error - ' + err));
        mongoose.connection.on('disconnected', () => console.log('Mongoose (Auction Svc): disconnected'));

    } catch (err) {
        console.error('Auction Service MongoDB Initial Connection Error:', err.message);
        process.exit(1);
    }
};
module.exports = connectDB;