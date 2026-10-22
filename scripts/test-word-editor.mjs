import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyPdfEdits } from "../lib/pdf/edit-engine.ts";
import { splitTextIntoFontRuns, resolveFontDisplayInfo } from "../lib/pdf/font-matcher.ts";
import { parseFontDetails, cleanFontName, findNearestBlockStyle } from "../lib/pdf/text-extractor.ts";

async function runComprehensiveTests() {
  console.log("==================================================");
  console.log("Starting Word-Like PDF Editor Verification Suite");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    } else {
      console.log(`✓ PASS: ${message}`);
      passedTests++;
    }
  }

  // -----------------------------------------------------------------
  // Step 1 & 3: Font Name Parsing, Subset Stripping & Auto Detection
  // -----------------------------------------------------------------
  console.log("\n--- Testing Font Parsing & Subset Stripping ---");
  const cleaned1 = cleanFontName("ABCDEF+Calibri-Bold");
  assert(cleaned1 === "Calibri-Bold", `cleanFontName correctly stripped subset prefix: ${cleaned1}`);

  const details1 = parseFontDetails("ABCDEF+Calibri-Bold");
  assert(details1.fontCategory === "calibri" && details1.isBold, "Detected Calibri Bold");

  const details2 = parseFontDetails("TimesNewRomanPS-ItalicMT");
  assert(details2.fontCategory === "serif" && details2.isItalic, "Detected Times New Roman Italic");

  const details3 = parseFontDetails("CMR10");
  assert(details3.fontCategory === "serif", "Detected Computer Modern (CMR10) as Serif");

  const details4 = parseFontDetails("CourierNewPS-BoldMT");
  assert(details4.fontCategory === "monospace" && details4.isBold, "Detected Courier New Bold");

  const details5 = parseFontDetails("NotoSansDevanagari-Regular");
  assert(details5.fontCategory === "devanagari", "Detected Noto Sans Devanagari");

  const details6 = parseFontDetails("GujaratiMT");
  assert(details6.fontCategory === "gujarati", "Detected GujaratiMT");

  // Font display & substitution info
  const subInfo = resolveFontDisplayInfo("ABCDEF+Calibri-Bold", "Calibri", "calibri");
  assert(
    subInfo.isSubstitute && subInfo.substitutedFontName.includes("Carlito"),
    `Substituted Calibri with Carlito: ${subInfo.substitutedFontName}`
  );

  // -----------------------------------------------------------------
  // Step 4: Nearest Block Style Inheritance (Empty space click)
  // -----------------------------------------------------------------
  console.log("\n--- Testing Empty-Space Click Style Inheritance ---");
  const mockBlocks = [
    {
      id: "b1",
      pageIndex: 0,
      originalText: "Heading",
      currentText: "Heading",
      x: 50,
      y: 750,
      pdfBounds: { x: 50, y: 740, width: 200, height: 25 },
      viewportBounds: { left: 50, top: 50, width: 200, height: 25 },
      fontSize: 24,
      fontFamily: "Calibri",
      fontCategory: "calibri",
      isBold: true,
      isItalic: false,
      color: { r: 0.1, g: 0.2, b: 0.8 },
    },
    {
      id: "b2",
      pageIndex: 0,
      originalText: "Body paragraph text",
      currentText: "Body paragraph text",
      x: 50,
      y: 600,
      pdfBounds: { x: 50, y: 580, width: 400, height: 40 },
      viewportBounds: { left: 50, top: 200, width: 400, height: 40 },
      fontSize: 11,
      fontFamily: "Times New Roman",
      fontCategory: "serif",
      isBold: false,
      isItalic: false,
      color: { r: 0.2, g: 0.2, b: 0.2 },
    },
  ];

  // Click near Heading (y = 730)
  const styleNearHeading = findNearestBlockStyle(mockBlocks, 60, 730);
  assert(
    styleNearHeading.fontSize === 24 && styleNearHeading.fontCategory === "calibri",
    "Empty click near heading inherited 24pt Calibri style"
  );

  // Click near Body (y = 570)
  const styleNearBody = findNearestBlockStyle(mockBlocks, 60, 570);
  assert(
    styleNearBody.fontSize === 11 && styleNearBody.fontCategory === "serif",
    "Empty click near body inherited 11pt Serif style"
  );

  // -----------------------------------------------------------------
  // Step 2 & 5: Font Runs & Per-Character Fallback
  // -----------------------------------------------------------------
  console.log("\n--- Testing Per-Character Fallback & Unicode Encoding ---");
  const testDoc = await PDFDocument.create();
  const primaryFont = await testDoc.embedFont(StandardFonts.Helvetica);

  // Mixed English and Devanagari (Hindi)
  const mixedTextHindi = "Salary: ₹50,000 प्रति माह";
  const hindiRuns = await splitTextIntoFontRuns(testDoc, primaryFont, mixedTextHindi, false);
  assert(hindiRuns.length >= 2, `Split mixed Hindi string into ${hindiRuns.length} font runs`);

  // Mixed English and Gujarati
  const mixedTextGuj = "Account નમસ્તે Verified";
  const gujRuns = await splitTextIntoFontRuns(testDoc, primaryFont, mixedTextGuj, false);
  assert(gujRuns.length >= 2, `Split mixed Gujarati string into ${gujRuns.length} font runs`);

  // -----------------------------------------------------------------
  // Test PDF 1: Resume PDF (Mixed Bold/Regular, Alignment & Underlines)
  // -----------------------------------------------------------------
  console.log("\n--- Testing Document 1: Resume PDF ---");
  const resumeDoc = await PDFDocument.create();
  const resumePage = resumeDoc.addPage([595, 842]);
  const stdFont = await resumeDoc.embedFont(StandardFonts.Helvetica);
  const stdBold = await resumeDoc.embedFont(StandardFonts.HelveticaBold);

  resumePage.drawText("JOHN DOE - SENIOR SOFTWARE ENGINEER", { x: 50, y: 780, size: 18, font: stdBold });
  resumePage.drawText("Email: john.doe@example.com | Phone: +1 555-0199", { x: 50, y: 760, size: 10, font: stdFont });
  resumePage.drawText("EXPERIENCE", { x: 50, y: 720, size: 14, font: stdBold });
  resumePage.drawText("Lead Architect at CloudCorp (2020 - Present)", { x: 50, y: 700, size: 11, font: stdFont });

  const resumeBytes = await resumeDoc.save();

  // Test editing: change title, underline header, add multiline summary
  const resumeEdits = [
    {
      id: "res_title",
      pageIndex: 0,
      originalText: "JOHN DOE - SENIOR SOFTWARE ENGINEER",
      currentText: "JOHN DOE - PRINCIPAL ARCHITECT",
      x: 50,
      y: 780,
      pdfBounds: { x: 50, y: 775, width: 450, height: 22 },
      viewportBounds: { left: 50, top: 40, width: 450, height: 22 },
      fontSize: 18,
      fontFamily: "Arial",
      fontCategory: "sans-serif",
      isBold: true,
      isItalic: false,
      isUnderline: true,
      textAlign: "left",
      color: { r: 0.1, g: 0.2, b: 0.7 },
      bgColor: { r: 1, g: 1, b: 1 },
      isEdited: true,
    },
    {
      id: "res_new_summary",
      pageIndex: 0,
      originalText: "",
      currentText:
        "Results-driven engineering leader with 10+ years specializing in distributed systems, client-side WebAssembly, and high-performance document processing pipelines.",
      x: 50,
      y: 660,
      pdfBounds: { x: 50, y: 640, width: 495, height: 40 },
      viewportBounds: { left: 50, top: 160, width: 495, height: 40 },
      fontSize: 10,
      fontFamily: "Arial",
      fontCategory: "sans-serif",
      isBold: false,
      isItalic: false,
      textAlign: "left",
      color: { r: 0.2, g: 0.2, b: 0.2 },
      bgColor: { r: 1, g: 1, b: 1 },
      isNew: true,
    },
  ];

  const resumeRes = await applyPdfEdits({
    fileData: resumeBytes,
    blocks: resumeEdits,
    outputFilename: "resume-edited.pdf",
  });
  assert(resumeRes.success && resumeRes.data.length > 1000, `Exported edited resume PDF (${resumeRes.data.length} bytes)`);

  // -----------------------------------------------------------------
  // Test PDF 2: Word-Exported PDF (Calibri & Carlito)
  // -----------------------------------------------------------------
  console.log("\n--- Testing Document 2: Word-Exported PDF (Calibri) ---");
  const wordDoc = await PDFDocument.create();
  const wordPage = wordDoc.addPage([595, 842]);
  wordPage.drawText("Quarterly Financial Overview", { x: 50, y: 780, size: 20, font: stdBold });
  const wordBytes = await wordDoc.save();

  const wordEdits = [
    {
      id: "word_block",
      pageIndex: 0,
      originalText: "Quarterly Financial Overview",
      currentText: "Quarterly Financial Overview & Strategic Projections",
      x: 50,
      y: 780,
      pdfBounds: { x: 50, y: 770, width: 500, height: 26 },
      viewportBounds: { left: 50, top: 40, width: 500, height: 26 },
      fontSize: 20,
      fontFamily: "Calibri",
      fontCategory: "calibri",
      isBold: true,
      isItalic: false,
      textAlign: "left",
      color: { r: 0.05, g: 0.1, b: 0.3 },
      bgColor: { r: 1, g: 1, b: 1 },
      isEdited: true,
    },
  ];

  const wordRes = await applyPdfEdits({
    fileData: wordBytes,
    blocks: wordEdits,
    outputFilename: "word-edited.pdf",
  });
  assert(wordRes.success && wordRes.data.length > 1000, `Exported Word/Calibri PDF using Carlito font (${wordRes.data.length} bytes)`);

  // -----------------------------------------------------------------
  // Test PDF 3: Indic PDF (Hindi & Gujarati Text)
  // -----------------------------------------------------------------
  console.log("\n--- Testing Document 3: Hindi / Gujarati Indic PDF ---");
  const indicDoc = await PDFDocument.create();
  const indicPage = indicDoc.addPage([595, 842]);
  indicPage.drawText("Multilingual Document Portal", { x: 50, y: 780, size: 16, font: stdBold });
  const indicBytes = await indicDoc.save();

  const indicEdits = [
    {
      id: "indic_hindi",
      pageIndex: 0,
      originalText: "",
      currentText: "नमस्ते दुनिया (Hello World in Hindi) — डिजिटल हस्ताक्षर उपलब्ध हैं।",
      x: 50,
      y: 720,
      pdfBounds: { x: 50, y: 710, width: 500, height: 22 },
      viewportBounds: { left: 50, top: 100, width: 500, height: 22 },
      fontSize: 13,
      fontFamily: "Noto Sans Devanagari",
      fontCategory: "devanagari",
      isBold: false,
      isItalic: false,
      color: { r: 0.1, g: 0.1, b: 0.1 },
      bgColor: { r: 1, g: 1, b: 1 },
      isNew: true,
    },
    {
      id: "indic_gujarati",
      pageIndex: 0,
      originalText: "",
      currentText: "નમસ્તે ગુજરાત (Hello Gujarat) — દસ્તાવેજ સફળતાપૂર્વક સંપાદિત થયો.",
      x: 50,
      y: 670,
      pdfBounds: { x: 50, y: 660, width: 500, height: 22 },
      viewportBounds: { left: 50, top: 150, width: 500, height: 22 },
      fontSize: 13,
      fontFamily: "Noto Sans Gujarati",
      fontCategory: "gujarati",
      isBold: false,
      isItalic: false,
      color: { r: 0.1, g: 0.1, b: 0.1 },
      bgColor: { r: 1, g: 1, b: 1 },
      isNew: true,
    },
  ];

  const indicRes = await applyPdfEdits({
    fileData: indicBytes,
    blocks: indicEdits,
    outputFilename: "indic-edited.pdf",
  });
  assert(indicRes.success && indicRes.data.length > 5000, `Exported Indic PDF with Noto Devanagari & Gujarati (${indicRes.data.length} bytes)`);

  // -----------------------------------------------------------------
  // Test PDF 4: Multi-page PDF
  // -----------------------------------------------------------------
  console.log("\n--- Testing Document 4: Multi-Page PDF ---");
  const multiDoc = await PDFDocument.create();
  for (let p = 0; p < 3; p++) {
    const page = multiDoc.addPage([595, 842]);
    page.drawText(`Document Page ${p + 1}`, { x: 50, y: 800, size: 14, font: stdFont });
  }
  const multiBytes = await multiDoc.save();

  const multiEdits = [
    {
      id: "multi_p1",
      pageIndex: 0,
      originalText: "Document Page 1",
      currentText: "Document Page 1 - Section 1 Updated",
      x: 50,
      y: 800,
      pdfBounds: { x: 50, y: 795, width: 300, height: 18 },
      viewportBounds: { left: 50, top: 30, width: 300, height: 18 },
      fontSize: 14,
      fontFamily: "Arial",
      fontCategory: "sans-serif",
      isBold: true,
      isItalic: false,
      color: { r: 0.1, g: 0.5, b: 0.1 },
      isEdited: true,
    },
    {
      id: "multi_p3",
      pageIndex: 2,
      originalText: "Document Page 3",
      currentText: "Document Page 3 - Appendix Verified",
      x: 50,
      y: 800,
      pdfBounds: { x: 50, y: 795, width: 300, height: 18 },
      viewportBounds: { left: 50, top: 30, width: 300, height: 18 },
      fontSize: 14,
      fontFamily: "Arial",
      fontCategory: "sans-serif",
      isBold: false,
      isItalic: true,
      color: { r: 0.6, g: 0.1, b: 0.1 },
      isEdited: true,
    },
  ];

  const multiRes = await applyPdfEdits({
    fileData: multiBytes,
    blocks: multiEdits,
    outputFilename: "multipage-edited.pdf",
  });
  const parsedMulti = await PDFDocument.load(multiRes.data);
  assert(parsedMulti.getPageCount() === 3, `Multi-page PDF maintained exactly 3 pages upon export`);

  console.log("\n==================================================");
  console.log(`Verification Complete: ${passedTests}/${totalTests} Tests Passed!`);
  console.log("==================================================");
}

runComprehensiveTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
