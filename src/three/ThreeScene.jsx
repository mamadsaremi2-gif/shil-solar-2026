import React from "react";

import {
  Canvas
} from "@react-three/fiber";

export default function ThreeScene() {

  return (

    <div className="three-scene-v15">

      <Canvas>

        <ambientLight />

        <mesh>

          <boxGeometry />

          <meshStandardMaterial
            color="#38bdf8"
          />

        </mesh>

      </Canvas>

    </div>

  );
}
