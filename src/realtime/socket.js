import { io } from "socket.io-client";

export const socket = io(
  "https://shil-engine-server.onrender.com",
  {
    autoConnect: false,
  }
);
