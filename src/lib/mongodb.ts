import { MongoClient, Db, Collection } from "mongodb";

// if (!process.env.MONGODB_URI) {
//   throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
// }

const uri = process.env.MONGO_URI || "";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.DB_NAME);
}

export async function getCollection(
  collectionName: string
): Promise<Collection> {
  const db = await getDb();
  return db.collection(collectionName);
}

// Collection names
export const COLLECTIONS = {
  PRICES: "prices",
  TRADES: "trades",
  ALERTS: "alerts",
  STOCKS: "stocks",
  USERS: "users",
} as const;

// Initialize database with indexes
export async function initializeDatabase() {
  try {
    const db = await getDb();

    // Create indexes for better performance
    await db
      .collection(COLLECTIONS.PRICES)
      .createIndex([{ symbol: 1 }, { fetched_at: -1 }]);

    await db
      .collection(COLLECTIONS.TRADES)
      .createIndex([{ symbol: 1 }, { trade_date: -1 }]);

    await db.collection(COLLECTIONS.ALERTS).createIndex([{ symbol: 1 }]);

    await db.collection(COLLECTIONS.STOCKS).createIndex([{ symbol: 1 }]);

    console.log("Database indexes initialized successfully");
  } catch (error) {
    console.error("Error initializing database indexes:", error);
  }
}

export default clientPromise;
