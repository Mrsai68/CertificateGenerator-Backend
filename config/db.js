import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  // Disable Mongoose command buffering to fail fast instead of hanging 10,000ms
  mongoose.set('bufferCommands', false);

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/certiverify';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Direct connection failed (${error.message}).`);

    // In-Memory MongoDB fallback is ONLY allowed in local environment, NOT Vercel Serverless
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      try {
        console.log(`[MongoDB] Launching automatic In-Memory MongoDB Server...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        await mongoose.connect(memoryUri);
        isConnected = true;
        console.log(`[MongoDB] In-Memory Database connected: ${memoryUri}`);
      } catch (memError) {
        console.error(`[MongoDB Error] Failed to start In-Memory MongoDB: ${memError.message}`);
      }
    } else {
      console.error(`[MongoDB Error] Ensure MONGODB_URI environment variable is configured in your Vercel Project Settings.`);
    }
  }
};
