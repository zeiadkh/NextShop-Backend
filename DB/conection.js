import mongoose from "mongoose";
import { catSchema } from "./models/category.model.js";

const MONGODB_URI = process.env.ATLAS;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the ATLAS environment variable inside .env.local or Vercel."
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless function invocations in production (Vercel).
 * This prevents the "Too many connections" error and 500 timeouts.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // 1. If we already have a cached connection, use it immediately
  if (cached.conn) {
    return cached.conn;
  }

  // 2. If a connection promise is already in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering for serverless
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("DB Connected Successfully");
      return mongooseInstance;
    });
  }

  try {
    // 3. Await the promise and cache the connection
    cached.conn = await cached.promise;
  } catch (err) {
    console.error("DB Connection Error:", err);
    cached.promise = null; // Reset promise on failure so it can retry on the next request
    throw err;
  }

  return cached.conn;
}

// ==================== Custom Query Helper ====================
mongoose.Query.prototype.selection = function (fields) {
  if (!fields) return this;
  
  const modelKeys = Object.keys(catSchema.paths);
  const fieldsArray = fields.split(" ");
  
  const validFields = fieldsArray.filter(
    (field) =>
      modelKeys.includes(field) || modelKeys.includes(field.split("-")[1])
  );
  
  return this.select(validFields);
};

export default connectDB;