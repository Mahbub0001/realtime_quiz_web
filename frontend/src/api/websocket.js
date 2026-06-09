import { WS_BASE_URL } from './config';

export const createWebSocket = (path) => {
  const wsUrl = `${WS_BASE_URL}${path}`;
  const ws = new WebSocket(wsUrl);
  return ws;
};
