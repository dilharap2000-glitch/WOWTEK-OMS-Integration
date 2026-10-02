import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'wowtek_oms';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (dbInstance) {
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
      });
      await client.connect();
    }

    dbInstance = client.db(MONGODB_DB_NAME);

    // Ensure collections and indexes exist
    const productsCollection = dbInstance.collection('products');
    await productsCollection.createIndex({ tenantId: 1, sku: 1 }, { unique: false, sparse: true });
    await productsCollection.createIndex({ tenantId: 1, barcode: 1 }, { unique: false, sparse: true });

    console.log(`Successfully connected to MongoDB Atlas database: ${MONGODB_DB_NAME}`);
    return dbInstance;
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    client = null;
    dbInstance = null;
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<{ status: string; database: string; latencyMs?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const db = await connectToDatabase();
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    return {
      status: 'healthy',
      database: MONGODB_DB_NAME,
      latencyMs,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      database: MONGODB_DB_NAME,
      error: error.message || 'Database connection failed',
    };
  }
}

export { ObjectId };
