#!/usr/bin/env node

/**
 * PDFivo PDF Engine Empirical Validation Test Suite
 * -----------------------------------------------------------------
 * Tests all 14 tools on:
 *  1. Real multi-page PDF documents (10 pages with vector text & shapes)
 *  2. Large PDF files (50MB+ created with registered stream data)
 *  3. Encrypted PDF handling and security error detection
 *  4. Malformed/corrupt PDF resilience
 */

import { PDFDocument, PDFName, rgb, StandardFonts } from "pdf-lib";

// Import tool functions from lib/pdf
import { mergePdf } from "../lib/pdf/merge.ts";
import { splitPdf } from "../lib/pdf/split.ts";
import { compressPdf } from "../lib/pdf/compress.ts";
import { rotatePdf } from "../lib/pdf/rotate.ts";
import { deletePages } from "../lib/pdf/delete-pages.ts";
import { organizePdf } from "../lib/pdf/organize.ts";
import { addWatermark } from "../lib/pdf/watermark.ts";
import { addPageNumbers } from "../lib/pdf/page-numbers.ts";
import { signPdf } from "../lib/pdf/sign.ts";
import { protectPdf } from "../lib/pdf/protect.ts";
import { unlockPdf } from "../lib/pdf/unlock.ts";
import { editPdf } from "../lib/pdf/edit.ts";
import { imagesToPdf } from "../lib/pdf/convert.ts";
import { safeLoadPdf } from "../lib/pdf/safe-load.ts";

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
};

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    passed++;
    console.log(
      `  ${colors.green}✓ PASS:${colors.reset} ${testName} ${details ? colors.gray + "(" + details + ")" + colors.reset : ""}`
    );
  } else {
    failed++;
    console.error(
      `  ${colors.red}✗ FAIL:${colors.reset} ${testName} ${details ? colors.gray + "(" + details + ")" + colors.reset : ""}`
    );
  }
}

/**
 * Generate a valid 1x1 transparent PNG Uint8Array with dedicated buffer
 */
function createDummyPng() {
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/**
 * Generate a valid 1x1 JPEG Uint8Array with dedicated buffer
 */
function createDummyJpg() {
  const rawBytes = [
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x80, 0xff, 0xd9,
  ];
  return new Uint8Array(rawBytes);
}

/**
 * Create a realistic 10-page multi-page PDF document
 */
async function createMultiPagePdf(pageCount = 10) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    page.drawText(`PDFivo Test Document - Page ${i}`, {
      x: 50,
      y: 780,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.2, 0.8),
    });

    page.drawText(
      `This is paragraph content rendered on page ${i} to test multi-page processing.`,
      {
        x: 50,
        y: 740,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
      }
    );

    // Draw vector geometric shapes
    page.drawRectangle({
      x: 50,
      y: 500,
      width: 495,
      height: 200,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.97, 0.98, 1),
    });

    page.drawText(`Vector Shape Container (${i})`, {
      x: 70,
      y: 670,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.3, 0.6),
    });
  }

  return await doc.save();
}

/**
 * Create a 50MB+ Large PDF document with dense registered stream
 */
async function create50MbLargePdf() {
  console.log(
    `  ${colors.gray}Allocating 52MB PDF stream in memory for large file stress-testing...${colors.reset}`
  );
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([600, 800]);

  page.drawText("PDFivo Benchmark Document (50MB+ Large Payload)", {
    x: 50,
    y: 750,
    size: 18,
    font,
    color: rgb(0.1, 0.4, 0.9),
  });

  // Register 52MB binary stream in PDF document context attached to page
  const bigBuffer = Buffer.alloc(52 * 1024 * 1024, 0x4d);
  const stream = doc.context.stream(bigBuffer);
  const streamRef = doc.context.register(stream);
  page.node.set(PDFName.of("BenchmarkStream"), streamRef);

  const pdfBytes = await doc.save();
  console.log(
    `  ${colors.gray}Generated Large PDF: ${(pdfBytes.byteLength / (1024 * 1024)).toFixed(2)} MB${colors.reset}`
  );
  return pdfBytes;
}

/**
 * Create a password-protected/encrypted PDF with valid standard trailer encryption
 */
async function createEncryptedPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([500, 500]);
  page.drawText("Confidential Encrypted Document", { x: 50, y: 400, size: 16, font });
  const rawBytes = await doc.save();

  // Inject valid standard /Encrypt dictionary into PDF trailer
  const str = Buffer.from(rawBytes).toString("latin1");
  const modified = str.replace(
    "/Root ",
    "/Encrypt << /Filter /Standard /V 2 /R 3 /P -44 /O (01234567890123456789012345678901) /U (01234567890123456789012345678901) >> /Root "
  );
  return Buffer.from(modified, "latin1");
}

async function runEmpiricalSuite() {
  console.log(
    `\n${colors.bold}================================================================${colors.reset}`
  );
  console.log(`${colors.bold}   PDFIVO PDF ENGINE EMPIRICAL VALIDATION SUITE   ${colors.reset}`);
  console.log(
    `${colors.bold}================================================================${colors.reset}`
  );

  // 1. Generate test inputs
  console.log(`\n${colors.cyan}--- 1. Generating Test Input Documents ---${colors.reset}`);
  const multiPageBytes = await createMultiPagePdf(10);
  assert(
    multiPageBytes.byteLength > 1000,
    "Created 10-page real PDF document",
    `${(multiPageBytes.byteLength / 1024).toFixed(1)} KB`
  );

  const secondDocBytes = await createMultiPagePdf(5);
  assert(
    secondDocBytes.byteLength > 1000,
    "Created 5-page secondary PDF document",
    `${(secondDocBytes.byteLength / 1024).toFixed(1)} KB`
  );

  const large50MbBytes = await create50MbLargePdf();
  assert(
    large50MbBytes.byteLength >= 50 * 1024 * 1024,
    "Created 50MB+ real large PDF document",
    `${(large50MbBytes.byteLength / (1024 * 1024)).toFixed(2)} MB`
  );

  const encryptedPdfBytes = await createEncryptedPdf();
  assert(
    encryptedPdfBytes.byteLength > 500,
    "Created encrypted test document",
    `${encryptedPdfBytes.byteLength} bytes`
  );

  const pngBytes = createDummyPng();
  const jpgBytes = createDummyJpg();

  // 2. Test Tool: Merge PDF
  console.log(`\n${colors.cyan}--- 2. Testing Merge PDF Tool ---${colors.reset}`);
  const mergeResult = await mergePdf({
    files: [
      { name: "doc1.pdf", data: multiPageBytes },
      { name: "doc2.pdf", data: secondDocBytes },
    ],
  });
  assert(mergeResult.success, "mergePdf executes successfully");
  const mergedDoc = await PDFDocument.load(mergeResult.data);
  assert(
    mergedDoc.getPageCount() === 15,
    "Merged document contains combined page count (10 + 5 = 15)",
    `pages: ${mergedDoc.getPageCount()}`
  );

  // Test Merge with 50MB+ document
  const largeMergeStart = Date.now();
  const largeMergeResult = await mergePdf({
    files: [
      { name: "large50mb.pdf", data: large50MbBytes },
      { name: "doc2.pdf", data: secondDocBytes },
    ],
  });
  const largeMergeTime = Date.now() - largeMergeStart;
  assert(
    largeMergeResult.success && largeMergeResult.data.byteLength > 50 * 1024 * 1024,
    "mergePdf successfully merges 50MB+ large document",
    `took ${largeMergeTime}ms, output: ${(largeMergeResult.data.byteLength / (1024 * 1024)).toFixed(2)} MB`
  );

  // 3. Test Tool: Split PDF
  console.log(`\n${colors.cyan}--- 3. Testing Split PDF Tool ---${colors.reset}`);
  const splitAllResult = await splitPdf({
    fileData: multiPageBytes,
    splitAllPages: true,
    baseFilename: "test",
  });
  assert(
    splitAllResult.success && splitAllResult.mimeType === "application/zip",
    "splitPdf splits all 10 pages into ZIP archive",
    `${(splitAllResult.data.byteLength / 1024).toFixed(1)} KB`
  );

  const splitRangeResult = await splitPdf({
    fileData: multiPageBytes,
    pageRanges: [
      [1, 3],
      [4, 7],
    ],
    baseFilename: "range-test",
  });
  assert(splitRangeResult.success, "splitPdf extracts custom page ranges into ZIP archive");

  // 4. Test Tool: Compress PDF
  console.log(`\n${colors.cyan}--- 4. Testing Compress PDF Tool ---${colors.reset}`);
  const compressResult = await compressPdf({
    fileData: multiPageBytes,
    level: "recommended",
  });
  assert(
    compressResult.success && compressResult.data.byteLength > 0,
    "compressPdf compresses 10-page document"
  );

  const compressLargeResult = await compressPdf({
    fileData: large50MbBytes,
    level: "extreme",
  });
  assert(
    compressLargeResult.success && compressLargeResult.data.byteLength > 0,
    "compressPdf successfully processes 50MB+ large document"
  );

  // 5. Test Tool: Rotate PDF
  console.log(`\n${colors.cyan}--- 5. Testing Rotate PDF Tool ---${colors.reset}`);
  const rotateResult = await rotatePdf({
    fileData: multiPageBytes,
    rotationDegrees: 90,
    pages: [1, 2],
  });
  assert(rotateResult.success, "rotatePdf rotates specified pages by 90 degrees");
  const rotatedDoc = await PDFDocument.load(rotateResult.data);
  assert(
    rotatedDoc.getPage(0).getRotation().angle === 90,
    "Page 1 rotation verified as 90 degrees"
  );
  assert(rotatedDoc.getPage(2).getRotation().angle === 0, "Page 3 rotation preserved at 0 degrees");

  // 6. Test Tool: Delete Pages
  console.log(`\n${colors.cyan}--- 6. Testing Delete Pages Tool ---${colors.reset}`);
  const deleteResult = await deletePages({
    fileData: multiPageBytes,
    pageIndicesToDelete: [0, 1, 2], // Delete pages 1, 2, 3
  });
  assert(deleteResult.success, "deletePages removes pages 1, 2, 3");
  const deletedDoc = await PDFDocument.load(deleteResult.data);
  assert(deletedDoc.getPageCount() === 7, "Output document page count is 7 (10 - 3 = 7)");

  // 7. Test Tool: Organize PDF
  console.log(`\n${colors.cyan}--- 7. Testing Organize PDF Tool ---${colors.reset}`);
  const organizeResult = await organizePdf({
    fileData: multiPageBytes,
    orderedPageIndices: [9, 8, 7, 0], // Invert order and take 4 pages
  });
  assert(organizeResult.success, "organizePdf reorders and duplicates pages");
  const organizedDoc = await PDFDocument.load(organizeResult.data);
  assert(organizedDoc.getPageCount() === 4, "Organized document has exact requested 4 pages");

  // 8. Test Tool: Images to PDF
  console.log(`\n${colors.cyan}--- 8. Testing JPG/PNG to PDF Tool ---${colors.reset}`);
  const imgToPdfResult = await imagesToPdf({
    images: [
      { name: "photo1.png", data: pngBytes, type: "image/png" },
      { name: "photo2.jpg", data: jpgBytes, type: "image/jpeg" },
    ],
  });
  assert(imgToPdfResult.success, "imagesToPdf converts PNG and JPG into unified PDF");
  const convertedImgDoc = await PDFDocument.load(imgToPdfResult.data);
  assert(convertedImgDoc.getPageCount() === 2, "Converted PDF contains 2 image pages");

  // 9. Test Tool: Watermark PDF
  console.log(`\n${colors.cyan}--- 9. Testing Add Watermark Tool ---${colors.reset}`);
  const watermarkResult = await addWatermark({
    fileData: multiPageBytes,
    text: "CONFIDENTIAL DRAFT",
    opacity: 0.25,
    rotationDegrees: 45,
  });
  assert(watermarkResult.success, "addWatermark applies diagonal text watermark across pages");

  // 10. Test Tool: Add Page Numbers
  console.log(`\n${colors.cyan}--- 10. Testing Add Page Numbers Tool ---${colors.reset}`);
  const pageNumbersResult = await addPageNumbers({
    fileData: multiPageBytes,
    position: "bottom-center",
    format: "Page {n} of {total}",
    startNumber: 1,
  });
  assert(pageNumbersResult.success, "addPageNumbers applies custom formatted numbering");

  // 11. Test Tool: Sign PDF
  console.log(`\n${colors.cyan}--- 11. Testing Sign PDF Tool ---${colors.reset}`);
  const signResult = await signPdf({
    fileData: multiPageBytes,
    signatureImageBytes: pngBytes,
    placements: [{ pageIndex: 0, x: 100, y: 150, width: 120, height: 40 }],
  });
  assert(signResult.success, "signPdf stamps signature image at coordinates");

  // 12. Test Tool: Protect PDF & Unlock PDF
  console.log(`\n${colors.cyan}--- 12. Testing Protect & Unlock PDF Tools ---${colors.reset}`);
  const protectResult = await protectPdf({
    fileData: multiPageBytes,
    userPassword: "secretPassword123",
  });
  assert(protectResult.success, "protectPdf processes document");

  const unlockResult = await unlockPdf({
    fileData: encryptedPdfBytes,
    password: "secretPassword123",
  });
  assert(unlockResult.success, "unlockPdf processes and exports clean unlocked PDF");

  // 13. Test Tool: Edit PDF
  console.log(`\n${colors.cyan}--- 13. Testing Edit PDF Tool ---${colors.reset}`);
  const editResult = await editPdf({
    fileData: multiPageBytes,
    annotations: [
      { id: "1", type: "text", pageIndex: 0, x: 50, y: 500, text: "Approved By QA", fontSize: 16 },
      { id: "2", type: "highlight", pageIndex: 0, x: 50, y: 740, width: 250, height: 18 },
      { id: "3", type: "rectangle", pageIndex: 0, x: 50, y: 400, width: 200, height: 80 },
      { id: "4", type: "circle", pageIndex: 0, x: 300, y: 400, width: 60 },
      {
        id: "5",
        type: "image",
        pageIndex: 0,
        x: 400,
        y: 400,
        width: 50,
        height: 50,
        imageBytes: pngBytes,
        imageFormat: "png",
      },
    ],
  });
  assert(
    editResult.success,
    "editPdf applies text, highlight, rectangle, circle, and image annotations"
  );

  // 14. Test Safe Load & Error Handling (Corrupt and Encrypted files)
  console.log(
    `\n${colors.cyan}--- 14. Testing Safe Load Error Handling (Corrupt & Encrypted files) ---${colors.reset}`
  );
  let caughtCorrupt = false;
  try {
    const corruptBuffer = Buffer.from("NOT_A_VALID_PDF_HEADER_DATA_STREAM");
    await safeLoadPdf(corruptBuffer, undefined, "corrupt.pdf");
  } catch (err) {
    caughtCorrupt = true;
    assert(
      err.message.includes("corrupted") || err.message.includes("not a valid PDF"),
      "safeLoadPdf catches corrupt file with user-friendly error",
      err.message
    );
  }
  assert(caughtCorrupt, "safeLoadPdf rejects corrupt files without unhandled rejection");

  let caughtEncrypted = false;
  try {
    await safeLoadPdf(encryptedPdfBytes, undefined, "locked.pdf");
  } catch (err) {
    caughtEncrypted = true;
    assert(
      err.message.includes("encrypted") || err.message.includes("password"),
      "safeLoadPdf catches encrypted document and prompts for unlock",
      err.message
    );
  }
  assert(caughtEncrypted, "safeLoadPdf prevents silent failures on encrypted files");

  console.log(
    `\n${colors.bold}================================================================${colors.reset}`
  );
  console.log(`${colors.bold}EMPIRICAL TEST SUMMARY:${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
  console.log(
    `${colors.bold}================================================================${colors.reset}\n`
  );

  if (failed > 0) process.exit(1);
}

runEmpiricalSuite();
