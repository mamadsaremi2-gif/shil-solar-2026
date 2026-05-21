import pako from "pako";

export function compressData(
  data
) {

  return pako.deflate(
    JSON.stringify(data),
    { to: "string" }
  );
}

export function decompressData(
  compressed
) {

  const json =
    pako.inflate(
      compressed,
      { to: "string" }
    );

  return JSON.parse(json);
}
