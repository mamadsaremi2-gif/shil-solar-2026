import { SHIL_ASSETS } from '../assets/assets.config';

export const REPORT_OUTPUT_CONFIG = {
  brandLogo: SHIL_ASSETS.logos.main,
  paper: {
    size: 'A4',
    direction: 'rtl',
    marginMm: 12,
  },
  export: {
    pdf: true,
    image: true,
    includeExecutiveSummary: true,
    includeEquipmentList: true,
    includeEngineeringWarnings: true,
  },
  fileNames: {
    pdfPrefix: 'SHIL-SOLAR-REPORT',
    imagePrefix: 'SHIL-SOLAR-SNAPSHOT',
  },
};
