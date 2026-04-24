import mongoose from "mongoose";

let connectPromise: Promise<typeof mongoose> | null = null;

type MongoErrorLike = {
  code?: number;
  codeName?: string;
  message?: string;
};

/**
 * Validates common MongoDB URI mistakes to fail fast with actionable messages.
 * @param uri MongoDB connection string from environment variables.
 */
function validateMongoUri(uri: string): void {
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://");
  }

  if (uri.includes("<") || uri.includes(">")) {
    throw new Error(
      "MONGODB_URI appears to contain placeholder brackets (< >). Replace with real credentials.",
    );
  }

  const atIndex = uri.indexOf("@");
  if (atIndex !== -1) {
    const credentialsPart = uri.slice(0, atIndex);
    const passwordSeparatorIndex = credentialsPart.lastIndexOf(":");
    if (passwordSeparatorIndex !== -1) {
      const password = credentialsPart.slice(passwordSeparatorIndex + 1);
      const hasUnencodedSpecialChar = /[@/#?]/.test(password);
      if (hasUnencodedSpecialChar) {
        throw new Error(
          "MONGODB_URI password likely has unencoded special characters. URL-encode it (e.g. @ => %40).",
        );
      }
    }
  }
}

/**
 * Maps low-level Mongo errors to actionable startup messages.
 * @param error Unknown error thrown by mongoose.connect().
 * @returns Error with clearer guidance when possible.
 */
function normalizeMongoConnectionError(error: unknown): Error {
  const mongoError = error as MongoErrorLike;
  const message = mongoError?.message ?? "";

  if (mongoError?.code === 8000 || message.toLowerCase().includes("bad auth")) {
    return new Error(
      "MongoDB authentication failed (Atlas code 8000). Verify DB username/password in MONGODB_URI, URL-encode special characters in the password, and ensure the database user has access to this cluster.",
    );
  }

  return error instanceof Error ? error : new Error("Unknown MongoDB connection error.");
}

/**
 * Establishes and returns a singleton MongoDB connection for the process.
 * @returns A resolved Mongoose instance once the connection is ready.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set.");
  }
  validateMongoUri(uri);

  connectPromise = mongoose.connect(uri).catch((error: unknown) => {
    connectPromise = null;
    throw normalizeMongoConnectionError(error);
  });

  return connectPromise;
}
