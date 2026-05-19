import * as Tone
from "tone";

export async function startTone() {

  await Tone.start();

  const synth =
    new Tone.Synth().toDestination();

  synth.triggerAttackRelease(
    "C4",
    "8n"
  );
}
