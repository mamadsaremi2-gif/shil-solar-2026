import React from "react";
import Tilt from "react-parallax-tilt";

export default function GlassTilt({
  children,
}) {

  return (

    <Tilt
      tiltMaxAngleX={6}
      tiltMaxAngleY={6}
      glareEnable={true}
      glareMaxOpacity={0.12}
      scale={1.01}
    >

      <div className="glass-tilt-v15">
        {children}
      </div>

    </Tilt>

  );
}
