import React from "react";

import {
  Document,
  Page,
  Text,
  View,
} from "react-pdf";

export default function ReportPDF() {

  return (

    <Document>

      <Page>

        <View>

          <Text>
            SHIL REPORT
          </Text>

        </View>

      </Page>

    </Document>

  );
}
