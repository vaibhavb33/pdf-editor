import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { applyPdfEdits } from "../lib/pdf/edit-engine.ts";

async function runEditEngineTest() {
  console.log("Testing in-place edit engine (applyPdfEdits)...");

  // 1. Create a dummy test PDF with known text
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("Hello World Original Text", {
    x: 50,
    y: 700,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText("Second line to be deleted", {
    x: 50,
    y: 650,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await doc.save();
  console.log(`Created test PDF: ${pdfBytes.length} bytes`);

  // 2. Test edit operations:
  // - Modify block 1 with new text + unicode character (e.g. "Hello World — Edited!")
  // - Delete block 2
  // - Add new block 3
  const blocks = [
    {
      id: "block_1",
      pageIndex: 0,
      originalText: "Hello World Original Text",
      currentText: "Hello World — Edited!",
      x: 50,
      y: 700,
      pdfBounds: { x: 50, y: 695, width: 200, height: 20 },
      viewportBounds: { left: 50, top: 100, width: 200, height: 20 },
      fontSize: 16,
      fontFamily: "sans-serif",
      isBold: false,
      isItalic: false,
      color: { r: 0.1, g: 0.1, b: 0.9 },
      bgColor: { r: 1, g: 1, b: 1 },
      isEdited: true,
    },
    {
      id: "block_2",
      pageIndex: 0,
      originalText: "Second line to be deleted",
      currentText: "",
      x: 50,
      y: 650,
      pdfBounds: { x: 50, y: 645, width: 180, height: 18 },
      viewportBounds: { left: 50, top: 150, width: 180, height: 18 },
      fontSize: 14,
      fontFamily: "sans-serif",
      isBold: false,
      isItalic: false,
      color: { r: 0, g: 0, b: 0 },
      bgColor: { r: 1, g: 1, b: 1 },
      isDeleted: true,
    },
    {
      id: "block_3",
      pageIndex: 0,
      originalText: "",
      currentText: "Newly added paragraph here",
      x: 50,
      y: 600,
      pdfBounds: { x: 50, y: 595, width: 220, height: 18 },
      viewportBounds: { left: 50, top: 200, width: 220, height: 18 },
      fontSize: 14,
      fontFamily: "serif",
      isBold: true,
      isItalic: false,
      color: { r: 0.8, g: 0.1, b: 0.1 },
      bgColor: { r: 1, g: 1, b: 1 },
      isNew: true,
    },
  ];

  const result = await applyPdfEdits({
    fileData: pdfBytes,
    blocks,
    outputFilename: "test-edited.pdf",
    onProgress: (progress, stage) => {
      console.log(`  [Progress ${progress}%] ${stage}`);
    },
  });

  if (!result.success || !result.data) {
    throw new Error("applyPdfEdits failed!");
  }

  // 3. Inspect generated PDF
  const editedDoc = await PDFDocument.load(result.data);
  const editedPages = editedDoc.getPages();
  if (editedPages.length !== 1) {
    throw new Error(`Expected 1 page, got ${editedPages.length}`);
  }

  console.log(`✓ PASS: applyPdfEdits exported ${result.data.length} bytes successfully.`);
}

runEditEngineTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
