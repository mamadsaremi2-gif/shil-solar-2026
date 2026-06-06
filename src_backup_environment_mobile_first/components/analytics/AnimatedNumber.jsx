import React from "react";
import CountUp from "react-countup";

export default function AnimatedNumber({
  value = 0,
  duration = 1.6,
}) {

  return (
    <CountUp
      end={value}
      duration={duration}
      separator=","
    />
  );
}
