import { Capacitor, registerPlugin } from "@capacitor/core";

const ShilExport = registerPlugin("ShilExport");

export function isNativeExportAvailable() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function blobToBase64(blob) {
  if (!(blob instanceof Blob) || blob.size <= 0) throw new Error("Export blob is empty");
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Unable to read export blob"));
    reader.onloadend = () => {
      const value = String(reader.result || "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.readAsDataURL(blob);
  });
}

export async function saveBlobNative(blob, filename, mimeType) {
  if (!isNativeExportAvailable()) return null;
  const base64 = await blobToBase64(blob);
  return await ShilExport.saveFile({ base64, filename, mimeType });
}

export async function shareBlobNative(blob, filename, mimeType, title = "SHIL") {
  if (!isNativeExportAvailable()) return null;
  const base64 = await blobToBase64(blob);
  return await ShilExport.shareFile({ base64, filename, mimeType, title });
}
