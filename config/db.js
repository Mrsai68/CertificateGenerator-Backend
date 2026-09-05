import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  mongoose.set('bufferCommands', false);

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/certiverify';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
  } catch (error) {
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        await mongoose.connect(memoryUri);
        isConnected = true;
      } catch (memError) {
        console.error('Database Connection Error:', memError.message);
      }
    } else {
      console.error('Database Connection Error:', error.message);
    }
  }
};
