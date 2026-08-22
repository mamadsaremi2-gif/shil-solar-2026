import EventEmitter from "eventemitter3";

export const realtimeBus = new EventEmitter();

export function emitRealtime(event, payload) {
  realtimeBus.emit(event, payload);
}

export function onRealtime(event, callback) {

  realtimeBus.on(event, callback);

  return () => realtimeBus.off(event, callback);
}
