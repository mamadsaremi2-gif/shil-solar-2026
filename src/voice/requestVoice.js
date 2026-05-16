export async function requestVoice() {

  const stream =
    await navigator
      .mediaDevices
      .getUserMedia({

        audio: true,

      });

  return stream;
}
