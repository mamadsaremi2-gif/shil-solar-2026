import pako from "pako";

export function compressJSON(data) {
  return pako.deflate(JSON.stringify(data), {
    to: "string",
  });
}

export function decompressJSON(compressed) {
  return JSON.parse(
    pako.inflate(compressed, {
      to: "string",
    })
  );
}
