import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URL!;

if (!MONGO_URI) {
    throw new Error("MONGODB_URL is not defined in environment variables");
}

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true,
            retryReads: true,
        }

        cached.promise = mongoose
            .connect(MONGO_URI, opts)
            .then(() => mongoose.connection)
            .catch((err) => {
                cached.promise = null;
                console.error("MongoDB connection error:", err);
                throw err;
            });
    }
    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw new Error("Error connecting to database");

    }

    return cached.conn;
}