import React from "react";

import {
  useTimer
} from "react-timer-hook";

export default function SHILTimer() {

  const expiryTimestamp =
    new Date();

  expiryTimestamp.setSeconds(
    expiryTimestamp.getSeconds() + 600
  );

  const {
    seconds,
    minutes,
  } = useTimer({
    expiryTimestamp,
  });

  return (

    <div className="timer-v15">

      {minutes}:{seconds}

    </div>

  );
}
