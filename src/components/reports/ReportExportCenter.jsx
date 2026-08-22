import React from "react";
import QRCode from "react-qr-code";
import {
  FileText,
  FileSpreadsheet,
  Table,
  Download,
  QrCode,
} from "lucide-react";

import { exportEngineeringPDF } from "../../reports/exportEngineeringPDF.js";
import { exportEngineeringExcel } from "../../reports/exportEngineeringExcel.js";
import { exportEngineeringCSV } from "../../reports/exportEngineeringCSV.js";

export default function ReportExportCenter() {
  return (
    <section className="report-export-center-v15">
      <div className="widget-head-v15">
        <div>
          <span>EXPORT CENTER</span>
          <h3>???? ????? ????? ??????</h3>
        </div>
      </div>

      <div className="report-export-grid-v15">
        <button onClick={exportEngineeringPDF}>
          <FileText size={22} />
          PDF ?????
        </button>

        <button onClick={exportEngineeringExcel}>
          <FileSpreadsheet size={22} />
          Excel ?????
        </button>

        <button onClick={exportEngineeringCSV}>
          <Table size={22} />
          CSV ????
        </button>

        <button>
          <Download size={22} />
          ???? ?????
        </button>
      </div>

      <div className="report-qr-card-v15">
        <div>
          <QrCode size={22} />
          <h4>?? ?????</h4>
          <p>???? ????? ????? ?? ????? ? ???????????? ????</p>
        </div>

        <div className="report-qr-box-v15">
          <QRCode value="SHIL-V15-ENGINEERING-REPORT" size={88} />
        </div>
      </div>
    </section>
  );
}
