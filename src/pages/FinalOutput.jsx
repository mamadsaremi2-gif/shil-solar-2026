import React from "react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { DataGrid, DataSection, PageStack } from "../components/ShilDesignSystem.jsx";

export default function FinalOutput() {
  return (
    <ShilPageShell title="خروجی نهایی محاسبات">
      <PageStack className="shil-final-output-clean-page">
        <DataSection title="خروجی مهندسی" meta="Final Output">
          <DataGrid rows={[
            ["انرژی روزانه", "در انتظار محاسبه"],
            ["توان سیستم", "در انتظار محاسبه"],
            ["بازده کل", "در انتظار محاسبه"],
            ["گزارش", "PDF / Excel / CSV"],
          ]} />
        </DataSection>
      </PageStack>
    </ShilPageShell>
  );
}
