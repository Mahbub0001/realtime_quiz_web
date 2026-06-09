export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  // Automatically replace http with ws (http -> ws, https -> wss)
  return API_BASE_URL.replace(/^http/, "ws");
};

export const WS_BASE_URL = getWsBaseUrl();
