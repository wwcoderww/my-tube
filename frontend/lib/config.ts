// frontend/src/lib/config.ts
const isServer = typeof window === "undefined";

export const BACKEND_URL = isServer
  ? process.env.NEXT_SERVER_BACKEND_URL || "http://localhost:8080"
  : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
