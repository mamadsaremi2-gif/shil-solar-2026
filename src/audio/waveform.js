import WaveSurfer
from "wavesurfer.js";

export function createWave(
  container
) {

  return WaveSurfer.create({

    container,

    waveColor:
      "#38bdf8",

    progressColor:
      "#7c3aed",

  });
}
