import { io } from "socket.io-client";

let socket;

export function getSocket() {

  if (!socket) {

    socket = io(
      "https://shil-realtime.local",
      {
        autoConnect: false,
        transports: ["websocket"],
      }
    );

  }

  return socket;
}

export function connectRealtime() {

  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectRealtime() {

  const socket = getSocket();

  if (socket.connected) {
    socket.disconnect();
  }

}
