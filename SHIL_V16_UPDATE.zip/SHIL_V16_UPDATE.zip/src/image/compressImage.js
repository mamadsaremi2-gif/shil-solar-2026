import imageCompression
from "browser-image-compression";

export async function compressImage(
  file
) {

  return await imageCompression(
    file,
    {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
    }
  );
}
