import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function slugify(value) {
  return String(value || 'solar-design-suite-report')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    .slice(0, 80);
}

function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    })
  );
}

function createSandbox() {
  const sandbox = document.createElement('div');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-20000px';
  sandbox.style.top = '0';
  sandbox.style.width = '794px';
  sandbox.style.pointerEvents = 'none';
  sandbox.style.opacity = '1';
  sandbox.style.zIndex = '-1';
  document.body.appendChild(sandbox);
  return sandbox;
}

async function renderCanvas(section) {
  return html2canvas(section, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#08111f',
    logging: false,
    windowWidth: Math.max(section.scrollWidth, section.clientWidth, 794),
    windowHeight: Math.max(section.scrollHeight, section.clientHeight, 1123),
  });
}

/**
 * Export only the executive summary page as a single A4 page.
 * The detailed engineering sections remain on the output screen, but the PDF is intentionally
 * limited to the one-page customer/engineer/summary/equipment sheet requested by the user.
 */
export async function exportEngineeringPdf({ element, fileName, title }) {
  if (!element) {
    throw new Error('REPORT_ELEMENT_MISSING');
  }

  const sandbox = createSandbox();
  try {
    const sourceSummary = element.querySelector('.executive-summary-page') || element;
    const clone = sourceSummary.cloneNode(true);
    clone.classList.add('pdf-export-mode', 'pdf-single-page-mode');
    sandbox.appendChild(clone);
    await waitForImages(clone);

    const canvas = await renderCanvas(clone);
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imageData = canvas.toDataURL('image/jpeg', 0.98);
    const widthRatio = pdfWidth / canvas.width;
    const heightRatio = pdfHeight / canvas.height;
    const scale = Math.min(widthRatio, heightRatio);
    const imageWidth = canvas.width * scale;
    const imageHeight = canvas.height * scale;
    const x = (pdfWidth - imageWidth) / 2;
    const y = (pdfHeight - imageHeight) / 2;

    pdf.addImage(imageData, 'JPEG', x, y, imageWidth, imageHeight, undefined, 'FAST');

    pdf.setProperties({
      title: title || fileName || 'Solar Design Suite Report',
      subject: 'One Page Engineering Executive Summary',
      author: 'Solar Design Suite',
      creator: 'Solar Design Suite',
    });

    const resolvedName = `${slugify(fileName || title || 'solar-design-suite-report')}.pdf`;
    pdf.save(resolvedName);
  } finally {
    sandbox.remove();
  }
}
