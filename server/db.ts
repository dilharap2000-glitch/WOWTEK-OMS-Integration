import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'wowtek_oms';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let indexesCreated = false;

/**
 * Connect to MongoDB Atlas with connection pooling and safe reuse across requests.
 * Database credentials are never exposed outside this server module.
 */
export async function connectToDatabase(): Promise<Db> {
  if (dbInstance && client) {
    return dbInstance;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined. Please configure MongoDB Atlas connection string.');
  }

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
    }

    dbInstance = client.db(MONGODB_DB_NAME);

    // Automatically create useful indexes on first connection
    if (!indexesCreated) {
      try {
        const productsCollection = dbInstance.collection('products');
        await productsCollection.createIndex({ tenantId: 1, sku: 1 }, { background: true });
        await productsCollection.createIndex({ tenantId: 1, barcode: 1 }, { background: true });
        indexesCreated = true;
      } catch (idxErr) {
        console.warn('Index initialization note:', idxErr);
      }
    }

    return dbInstance;
  } catch (error: any) {
    client = null;
    dbInstance = null;
    throw new Error(`MongoDB connection failed: ${error.message || 'Unable to connect to cluster'}`);
  }
}

/**
 * Health check endpoint helper. Verifies MongoDB connection without exposing credentials.
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  database: string;
  latencyMs?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const db = await connectToDatabase();
    await db.command({ ping: 1 });
    const latencyMs = Math.max(1, Date.now() - startTime);

    return {
      status: 'healthy',
      database: MONGODB_DB_NAME,
      latencyMs,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      database: MONGODB_DB_NAME,
      error: error.message || 'Database connection error',
    };
  }
}

export { ObjectId };
