import {
  useIdleTimer
} from "react-idle-timer";

export function useIdleLogout(
  onIdle
) {

  useIdleTimer({

    timeout: 1000 * 60 * 10,

    onIdle,

  });
}
