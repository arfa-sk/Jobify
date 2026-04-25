import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://jobverse_user:jobverse_user%40%40123@cluster0.7ukinnj.mongodb.net/jobify?appName=Cluster0";

async function fixIndex() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const collection = db.collection('cvs');
    
    console.log("Dropping shareSlug_1 index...");
    await collection.dropIndex('shareSlug_1');
    
    console.log("Index dropped successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

fixIndex();
