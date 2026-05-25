import React from "react";
import { Document, Page } from "react-pdf";

export default function PDFViewer({
  file,
}) {

  return (
    <div className="pdf-viewer-v15">

      <Document file={file}>

        <Page
          pageNumber={1}
          width={320}
        />

      </Document>

    </div>
  );
}
