const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' }); // Si .env est à la racine de user-service
// ou require('dotenv').config(); si vous lancez node server.js directement depuis user-service/
// et que .env est dans user-service/

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected to User Service DB...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;