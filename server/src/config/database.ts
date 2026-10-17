import mongoose from 'mongoose';
import { db } from '../models/dataStore.js';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spiceroots';
  
  // Initialize embedded persistent store immediately
  db.init();

  try {
    // Attempt Mongoose connection with fallback so server never crashes if offline or IP not whitelisted
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      dbName: 'spiceroots',
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    console.log(`✅ [Database] Successfully connected to MongoDB Atlas / Local at: ${uri}`);
    await db.syncWithMongo();
  } catch (err) {
    console.log(`ℹ️ [Database] MongoDB Atlas/Local connection note: ${(err as Error).message}`);
    console.log(`   (Tip: If using Atlas, ensure your IP is whitelisted in Network Access: 0.0.0.0/0)`);
    console.log(`   Using built-in persistent DataStore engine (data/store.json).`);
  }
}
