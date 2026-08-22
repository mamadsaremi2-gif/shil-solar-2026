import React from "react";
import CountUp from "react-countup";

export default function AnimatedCounter({
  value = 0,
}) {

  return (

    <CountUp
      end={value}
      duration={1.8}
      separator=","
    />

  );
}
