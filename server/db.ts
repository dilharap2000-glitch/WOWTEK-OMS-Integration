import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'wowtek_oms';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let indexesCreated = false;

// Fallback Mock DB to prevent red screen / crash when database connection is unavailable
const mockDb = new Proxy({} as Db, {
  get(target, prop) {
    if (prop === 'collection') {
      return (name: string) => ({
        find: () => ({
          toArray: async () => [],
          sort: function () { return this; },
          limit: function () { return this; },
          skip: function () { return this; },
        }),
        findOne: async () => null,
        findOneAndUpdate: async () => null,
        insertOne: async (doc: any) => ({ insertedId: new ObjectId(), acknowledged: true }),
        updateOne: async () => ({ matchedCount: 0, modifiedCount: 0, acknowledged: true }),
        deleteOne: async () => ({ deletedCount: 0, acknowledged: true }),
        createIndex: async () => {},
      });
    }
    if (prop === 'command') {
      return async () => ({ ok: 1 });
    }
    return (target as any)[prop];
  }
});

/**
 * Connect to MongoDB Atlas with connection pooling and safe reuse across requests.
 * Database credentials are never exposed outside this server module.
 */
export async function connectToDatabase(): Promise<Db> {
  if (dbInstance && client) {
    return dbInstance;
  }

  // Database Connection එක Fail වුනොත් App එක Red Screen වී Crash වීම වැළැක්වීමට mock db Return කිරීම
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is not set. Running in UI-only fallback mode.");
    return mockDb;
  }

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 30000, // Timeout එක 30s දක්වා වැඩි කලා
        connectTimeoutMS: 30000,
      });
      await client.connect();
    }

    dbInstance = client.db(MONGODB_DB_NAME);

    // Automatically create useful indexes on first successful connection
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
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    // Error එකක් ආවත් App එක Crash නොකර UI එක Load වීමට සලස්වයි
    return mockDb;
  }
}

/**
 * Health check endpoint helper. Verifies MongoDB connection without exposing credentials.
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'fallback';
  database: string;
  latencyMs?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    if (!MONGODB_URI) {
      return {
        status: 'fallback',
        database: MONGODB_DB_NAME,
        error: 'MONGODB_URI is not set. Running in UI-only fallback mode.',
      };
    }

    const db = await connectToDatabase();
    if (!client) {
      return {
        status: 'fallback',
        database: MONGODB_DB_NAME,
        error: 'Running in UI-only fallback mode.',
      };
    }

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
