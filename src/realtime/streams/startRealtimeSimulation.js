import { livePowerStream } from "./livePowerStream.js";
import { useRealtimeStore } from "./realtimeStore.js";

let subscription;

export function startRealtimeSimulation() {

  if (subscription) {
    return;
  }

  const setRealtimeData =
    useRealtimeStore.getState()
      .setRealtimeData;

  subscription =
    livePowerStream.subscribe((payload) => {

      setRealtimeData(payload);

    });

}

export function stopRealtimeSimulation() {

  if (subscription) {

    subscription.unsubscribe();

    subscription = null;

  }

}
