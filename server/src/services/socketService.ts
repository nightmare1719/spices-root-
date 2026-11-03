import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import { ProductModel } from '../models/mongoSchemas.js';
import { db } from '../models/dataStore.js';

let io: SocketIOServer | null = null;

/**
 * Initializes Socket.io and sets up MongoDB Change Stream on the 'products' collection.
 * Enables bidirectional real-time synchronization between MongoDB and connected frontend clients.
 */
export function initSocket(httpServer: HttpServer, allowedOrigins: string[]): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, '');
        const isAllowed = 
          allowedOrigins.includes(normalized) ||
          normalized.endsWith('.vercel.app') ||
          normalized.endsWith('.onrender.com') ||
          process.env.NODE_ENV !== 'production';
        callback(null, isAllowed);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Start watching MongoDB products change stream
  setupProductChangeStream();

  return io;
}

/**
 * Returns active Socket.io instance for manual emission if needed.
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Sets up MongoDB Change Stream on the 'products' collection using Mongoose.
 * Listens explicitly for 'insert', 'update', and 'replace' operations,
 * broadcasting changes made directly in MongoDB (e.g., Compass or Atlas) to all frontend clients.
 */
function setupProductChangeStream() {
  if (mongoose.connection.readyState !== 1) {
    // Wait until Mongoose connects
    mongoose.connection.once('connected', () => setupProductChangeStream());
    return;
  }

  try {
    console.log('📡 [ChangeStream] Initializing MongoDB Change Stream on products collection...');

    // Pipeline matching insert, update, replace, and delete operations
    const changeStream = ProductModel.watch(
      [
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'replace', 'delete'] }
          }
        }
      ],
      { fullDocument: 'updateLookup' } // Ensures full document payload is returned on updates
    );

    changeStream.on('change', (change: any) => {
      const { operationType, documentKey, fullDocument } = change;
      const docId = documentKey?._id?.toString();

      console.log(`⚡ [ChangeStream] Detected ${operationType} on product ${docId}`);

      if (operationType === 'insert') {
        if (fullDocument) {
          db.upsertProductFromMongo(fullDocument);
          io?.emit('product:created', fullDocument);
        }
      } else if (operationType === 'update' || operationType === 'replace') {
        if (fullDocument) {
          // Sync in-memory store so internal caches reflect manual DB changes immediately
          db.upsertProductFromMongo(fullDocument);
          // Broadcast updated product payload to all connected frontend clients
          io?.emit('product:updated', fullDocument);
        }
      } else if (operationType === 'delete') {
        if (docId) {
          db.deleteProduct(docId);
          io?.emit('product:deleted', { _id: docId, id: docId });
        }
      }
    });

    changeStream.on('error', (err: any) => {
      // Standalone MongoDB instances without a replica set cannot open Change Streams
      if (err.code === 40573 || err.message?.includes('replica set')) {
        console.warn('⚠️ [ChangeStream] Note: Change Streams require a MongoDB replica set (e.g., Atlas or local RS). Standalone mode active.');
      } else {
        console.error('⚠️ [ChangeStream] Stream error:', err.message);
      }
    });
  } catch (err: any) {
    console.warn('⚠️ [ChangeStream] Could not initialize Change Stream:', err.message);
  }
}

