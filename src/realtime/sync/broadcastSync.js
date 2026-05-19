import { BroadcastChannel } from "broadcast-channel";

export const realtimeChannel =
  new BroadcastChannel("SHIL_REALTIME");

export function broadcastRealtime(payload) {

  realtimeChannel.postMessage(payload);

}

export function listenRealtime(callback) {

  realtimeChannel.onmessage = callback;

}
