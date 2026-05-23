import { io }
from "socket.io-client";

export const socket =
  io("https://socket.shil.app", {

    autoConnect: false,

  });
