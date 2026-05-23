import JSZip from "jszip";

import {
  saveAs
} from "file-saver";

export async function createBackup(
  data
) {

  const zip =
    new JSZip();

  zip.file(
    "backup.json",
    JSON.stringify(data)
  );

  const content =
    await zip.generateAsync({
      type: "blob",
    });

  saveAs(
    content,
    "shil-backup.zip"
  );
}
