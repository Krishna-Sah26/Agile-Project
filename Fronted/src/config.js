const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_URL = rawApiUrl.replace(/\/$/, "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;
