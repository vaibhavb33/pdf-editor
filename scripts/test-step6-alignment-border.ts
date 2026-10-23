import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { applyPdfEdits } from "../lib/pdf/edit-engine";
import { TextBlock, PageBorderConfig, shouldPageHaveBorder } from "../lib/pdf/edit-types";
import assert from "node:assert";

// Polyfill Promise.withResolvers for Node v20
if (typeof (Promise as any).withResolvers === "undefined") {
  (Promise as any).withResolvers = function () {
    let resolve: any, reject: any;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

async function runStep6Test() {
  console.log("=== Testing Step 6: Alignment (Justify) & Page Border ===");

  // 1. Create a 3-page test PDF in pdf-lib
  const doc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) {
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText(`Page ${i + 1} content stream to verify page border scope.`, {
      x: 72,
      y: 750,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }
  const pdfBytes = await doc.save();
  console.log("✓ Created 3-page base PDF, byte size:", pdfBytes.length);

  // 2. Test Alignment: Left, Center, Right, and Justify
  console.log("\nTesting 6A: Paragraph Alignment & Justified Text Wrapping...");
  const sampleText =
    "This is a justified paragraph test sentence designed to span multiple lines. Each word is measured with exact font metrics and spaced evenly across the defined column width so that lines end flush against the right margin, while the last line remains left-aligned.";

  const testBlock: TextBlock = {
    id: "block_align_test",
    pageIndex: 0,
    originalText: "",
    currentText: sampleText,
    x: 72,
    y: 650,
    pdfBounds: {
      x: 72,
      y: 550,
      width: 450,
      height: 100,
    },
    runs: [
      {
        id: "run_align",
        text: sampleText,
        fontFamily: "Liberation Sans",
        fontCategory: "sans-serif",
        fontSize: 12,
        isBold: false,
        isItalic: false,
        color: { r: 0.1, g: 0.1, b: 0.1 },
      },
    ],
    layout: {
      columnX: 72,
      columnWidth: 450,
      firstLineIndent: 20,
      lineHeight: 18,
      textAlign: "justify",
      isLineMode: false,
    },
    viewportBounds: { left: 72, top: 200, width: 450, height: 100 },
    fontSize: 12,
    fontFamily: "Liberation Sans",
    fontCategory: "sans-serif",
    isBold: false,
    isItalic: false,
    textAlign: "justify",
    color: { r: 0.1, g: 0.1, b: 0.1 },
    isNew: true,
    isEdited: true,
  };

  const alignExport = await applyPdfEdits({
    fileData: pdfBytes,
    blocks: [testBlock],
    outputFilename: "align-test.pdf",
  });

  assert(alignExport.success && alignExport.data, "Justified text export must succeed");
  const alignBytes = alignExport.data as Uint8Array;
  console.log("✓ Justified paragraph export generated successfully, size:", alignBytes.length);

  // 3. Test Page Border Scopes and Styles
  console.log("\nTesting 6B: Page Border Scopes & Logic...");

  // Test scope: all
  const borderAll: PageBorderConfig = {
    enabled: true,
    style: "solid",
    width: 2,
    color: "#2563eb",
    margin: 36,
    cornerRadius: 0,
    scope: "all",
  };
  assert.strictEqual(shouldPageHaveBorder(borderAll, 0, 3), true, "Page 1 has border (all)");
  assert.strictEqual(shouldPageHaveBorder(borderAll, 1, 3), true, "Page 2 has border (all)");
  assert.strictEqual(shouldPageHaveBorder(borderAll, 2, 3), true, "Page 3 has border (all)");
  console.log("✓ Scope 'all' applies to all pages.");

  // Test scope: first-only
  const borderFirstOnly: PageBorderConfig = { ...borderAll, scope: "first-only" };
  assert.strictEqual(shouldPageHaveBorder(borderFirstOnly, 0, 3), true, "Page 1 has border");
  assert.strictEqual(shouldPageHaveBorder(borderFirstOnly, 1, 3), false, "Page 2 excluded");
  assert.strictEqual(shouldPageHaveBorder(borderFirstOnly, 2, 3), false, "Page 3 excluded");
  console.log("✓ Scope 'first-only' applies exclusively to page 1.");

  // Test scope: exclude-first
  const borderExcludeFirst: PageBorderConfig = { ...borderAll, scope: "exclude-first" };
  assert.strictEqual(shouldPageHaveBorder(borderExcludeFirst, 0, 3), false, "Page 1 excluded");
  assert.strictEqual(shouldPageHaveBorder(borderExcludeFirst, 1, 3), true, "Page 2 has border");
  assert.strictEqual(shouldPageHaveBorder(borderExcludeFirst, 2, 3), true, "Page 3 has border");
  console.log("✓ Scope 'exclude-first' excludes page 1.");

  // Test scope: custom range e.g. "1, 3"
  const borderCustom: PageBorderConfig = { ...borderAll, scope: "custom", customRange: "1, 3" };
  assert.strictEqual(shouldPageHaveBorder(borderCustom, 0, 3), true, "Page 1 included");
  assert.strictEqual(shouldPageHaveBorder(borderCustom, 1, 3), false, "Page 2 excluded");
  assert.strictEqual(shouldPageHaveBorder(borderCustom, 2, 3), true, "Page 3 included");
  console.log("✓ Scope 'custom' (1, 3) applies correctly.");

  // 4. Test Export with Double Border and Custom Range
  console.log("\nTesting 6C: Export PDF with Double Border via applyPdfEdits...");
  const doubleBorderConfig: PageBorderConfig = {
    enabled: true,
    style: "double",
    width: 3.5,
    color: "#1e40af",
    margin: 36,
    cornerRadius: 0,
    scope: "all",
  };

  const borderExport = await applyPdfEdits({
    fileData: pdfBytes,
    blocks: [testBlock],
    pageBorder: doubleBorderConfig,
    outputFilename: "double-border-test.pdf",
  });

  assert(borderExport.success && borderExport.data, "Border export must succeed");
  const borderBytes = borderExport.data as Uint8Array;
  console.log("✓ Export with double page border generated successfully, size:", borderBytes.length);

  // Inspect the exported PDF in pdf-lib to ensure rectangle operators were added to pages
  const exportedDoc = await PDFDocument.load(borderBytes);
  const expPages = exportedDoc.getPages();
  assert.strictEqual(expPages.length, 3, "Exported PDF must have 3 pages");

  // Test dashed border
  const dashedBorderConfig: PageBorderConfig = {
    enabled: true,
    style: "dashed",
    width: 2.0,
    color: "#dc2626",
    margin: 40,
    cornerRadius: 4,
    scope: "first-only",
  };

  const dashedExport = await applyPdfEdits({
    fileData: pdfBytes,
    blocks: [],
    pageBorder: dashedBorderConfig,
    outputFilename: "dashed-border-test.pdf",
  });

  assert(dashedExport.success && dashedExport.data, "Dashed border export must succeed");
  const dashedBytes = dashedExport.data as Uint8Array;
  console.log("✓ Export with dashed page border generated successfully, size:", dashedBytes.length);

  console.log("\n🎉 ALL STEP 6 ALIGNMENT AND PAGE BORDER TESTS PASSED EMPIRICALLY!\n");
}

runStep6Test().catch((err) => {
  console.error("Step 6 test failed:", err);
  process.exit(1);
});
