import mongoose from 'mongoose';
import { db } from '../models/dataStore.js';
export async function connectDatabase() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spiceroots';
    // Initialize embedded persistent store immediately
    db.init();
    try {
        // Attempt Mongoose connection with short timeout so server does not hang if Mongo is offline
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 2000,
            connectTimeoutMS: 2000
        });
        console.log(`✅ [Database] Successfully connected to MongoDB Atlas / Local at: ${uri}`);
    }
    catch (err) {
        console.log(`ℹ️ [Database] MongoDB connection not active (${err.message}). Using built-in persistent DataStore (data/store.json).`);
    }
}
