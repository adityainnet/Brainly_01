import "dotenv/config";

export const PORT = Number(process.env.PORT || 3000);
export const MONGODB_URI = process.env.MONGODB_URI || "";
export const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-me";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
