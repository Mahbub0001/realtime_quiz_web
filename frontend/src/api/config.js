export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Dynamically derive WebSocket URL from API URL if VITE_WS_BASE_URL is not set
const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  
  // Clean up API_BASE_URL if it has trailing slashes
  const apiClean = API_BASE_URL.replace(/\/+$/, "");
  
  if (apiClean.startsWith("https://")) {
    return apiClean.replace("https://", "wss://");
  } else if (apiClean.startsWith("http://")) {
    return apiClean.replace("http://", "ws://");
  }
  
  return "ws://localhost:8000";
};

export const WS_BASE_URL = getWsBaseUrl();
