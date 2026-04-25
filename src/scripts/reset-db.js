const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://jobverse_user:jobverse_user%40%40123@cluster0.7ukinnj.mongodb.net/jobify?appName=Cluster0";

async function resetDB() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully.");

        const collections = ['cvs', 'users', 'applications', 'jobs'];
        
        for (const colName of collections) {
            console.log(`Clearing collection: ${colName}...`);
            try {
                await mongoose.connection.collection(colName).deleteMany({});
                console.log(`Cleared ${colName}.`);
            } catch (err) {
                console.log(`Collection ${colName} might not exist or failed to clear.`);
            }
        }

        console.log("Database reset complete.");
        process.exit(0);
    } catch (err) {
        console.error("Reset failed:", err);
        process.exit(1);
    }
}

resetDB();
