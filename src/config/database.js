const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Kết nối đến MongoDB server port 30000
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            readPreference: 'secondaryPreferred',
            maxStalenessSeconds: 90
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Event listeners
mongoose.connection.on('disconnected', () => {
    console.log('📤 MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('📥 MongoDB connected');
});

module.exports = connectDB;