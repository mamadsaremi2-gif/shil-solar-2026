import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getOfflineProjects, shilDB } from "../db/shilDB.js";

export async function exportOfflineBackup() {
  const zip = new JSZip();

  const projects = await getOfflineProjects();
  const drafts = await shilDB.drafts.toArray();
  const reports = await shilDB.reports.toArray();

  zip.file("projects.json", JSON.stringify(projects, null, 2));
  zip.file("drafts.json", JSON.stringify(drafts, null, 2));
  zip.file("reports.json", JSON.stringify(reports, null, 2));

  const blob = await zip.generateAsync({
    type: "blob",
  });

  saveAs(blob, `SHIL-backup-${Date.now()}.zip`);
}
