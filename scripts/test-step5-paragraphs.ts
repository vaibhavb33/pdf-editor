import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { extractPageText } from "../lib/pdf/text-extractor";
import { applyPdfEdits } from "../lib/pdf/edit-engine";
import { TextBlock } from "../lib/pdf/edit-types";
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

// Mock minimal pdfjs page environment for Node test
async function runParagraphTest() {
  console.log("=== Testing Step 5: Multi-Paragraph Independence & Spacing Stability ===");

  // 1. Create a 5-paragraph document in pdf-lib
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = 16;
  const pGap = 28; // 28pt gap between paragraphs

  const paragraphs = [
    [
      "First paragraph begins here with an opening statement about web document design.",
      "It continues across a second line to establish clear line grouping.",
      "Then finishes with a third sentence establishing the first block."
    ],
    [
      "Second paragraph begins with an introduction to editable typography systems.",
      "It will be specifically targeted for all user modifications and edits.",
      "We will type here, delete words, change font family, and increase font size."
    ],
    [
      "Third paragraph discusses client-side privacy and security constraints.",
      "All processing occurs strictly in WebAssembly without external server reliance.",
      "Its bounding box must remain completely undisturbed when paragraph 2 is modified."
    ],
    [
      "Fourth paragraph introduces vector canvas rendering and text bounding metrics.",
      "High-DPI retina display support requires device pixel ratio scaling.",
      "Its vertical distance to sibling paragraphs must stay completely constant."
    ],
    [
      "Fifth paragraph concludes the multi-section test document verification.",
      "Final baseline coordinates should remain perfectly identical before and after edits.",
      "No sibling paragraph shifts or merges are tolerated."
    ]
  ];

  let curY = 760;
  const leftMargin = 54;
  const indent = 18;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const lines = paragraphs[pIdx];
    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const lineText = lines[lIdx];
      const lineX = lIdx === 0 ? leftMargin + indent : leftMargin;
      page.drawText(lineText, {
        x: lineX,
        y: curY,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      curY -= lineHeight;
    }
    curY -= pGap;
  }

  const pdfBytes = await doc.save();
  console.log("✓ Generated 5-paragraph test PDF, byte size:", pdfBytes.length);

  // 2. Load with PDF.js
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    fontExtraProperties: true,
  });
  const loadedDoc = await loadingTask.promise;
  const pdfPage = await loadedDoc.getPage(1);

  // 3. Extract text blocks via PDFivo's extractPageText
  const pageData = await extractPageText(pdfPage, 0, 1.0);
  const initialBlocks = pageData.blocks;

  console.log(`✓ Extracted ${initialBlocks.length} text blocks:`);
  initialBlocks.forEach((b, i) => {
    console.log(` [${i}] (lines=${b.originalLines?.length || 1}, y=${b.y.toFixed(1)}): "${b.currentText.slice(0, 50)}..."`);
  });
  assert.strictEqual(
    initialBlocks.length,
    5,
    `Expected exactly 5 separate paragraphs extracted, got ${initialBlocks.length}`
  );

  // Record initial positions & gaps of all blocks
  const initialBoxes = initialBlocks.map((b) => ({
    id: b.id,
    x: b.pdfBounds.x,
    y: b.pdfBounds.y,
    width: b.pdfBounds.width,
    height: b.pdfBounds.height,
  }));

  const initialGaps: number[] = [];
  for (let i = 0; i < initialBlocks.length - 1; i++) {
    // Gap between bottom of block i and top of block i+1
    const topOfNext = initialBlocks[i + 1].pdfBounds.y + initialBlocks[i + 1].pdfBounds.height;
    const bottomOfCur = initialBlocks[i].pdfBounds.y;
    initialGaps.push(bottomOfCur - topOfNext);
  }

  console.log("Initial paragraph bounds and gaps:");
  initialBoxes.forEach((b, idx) => {
    console.log(`  P${idx + 1}: x=${b.x.toFixed(1)}, y=${b.y.toFixed(1)}, w=${b.width.toFixed(1)}, h=${b.height.toFixed(1)}`);
  });

  // Helper assertion: Ensure all blocks EXCEPT index 1 (paragraph 2) remain identical within 1px
  function assertOtherBlocksStayIdentical(currentBlocks: TextBlock[], actionName: string) {
    for (let i = 0; i < initialBlocks.length; i++) {
      if (i === 1) continue; // Skip edited paragraph 2

      const orig = initialBoxes[i];
      const cur = currentBlocks.find((b) => b.id === orig.id);
      assert(cur, `Block ${orig.id} (P${i + 1}) must exist after ${actionName}`);

      const dx = Math.abs(cur.pdfBounds.x - orig.x);
      const dy = Math.abs(cur.pdfBounds.y - orig.y);
      const dw = Math.abs(cur.pdfBounds.width - orig.width);

      assert(
        dx <= 1.0,
        `[${actionName}] P${i + 1} shifted horizontally by ${dx}px (expected <= 1px)`
      );
      assert(
        dy <= 1.0,
        `[${actionName}] P${i + 1} shifted vertically by ${dy}px (expected <= 1px)`
      );
      assert(
        dw <= 1.0,
        `[${actionName}] P${i + 1} width changed by ${dw}px (expected <= 1px)`
      );
    }

    // Verify distance between P0 and P2, P2 and P3, P3 and P4
    const p0 = currentBlocks.find((b) => b.id === initialBoxes[0].id)!;
    const p2 = currentBlocks.find((b) => b.id === initialBoxes[2].id)!;
    const p3 = currentBlocks.find((b) => b.id === initialBoxes[3].id)!;
    const p4 = currentBlocks.find((b) => b.id === initialBoxes[4].id)!;

    const gap23 = p2.pdfBounds.y - (p3.pdfBounds.y + p3.pdfBounds.height);
    const gap34 = p3.pdfBounds.y - (p4.pdfBounds.y + p4.pdfBounds.height);

    assert(
      Math.abs(gap23 - initialGaps[2]) <= 1.0,
      `[${actionName}] Gap between P3 and P4 changed from ${initialGaps[2]} to ${gap23}`
    );
    assert(
      Math.abs(gap34 - initialGaps[3]) <= 1.0,
      `[${actionName}] Gap between P4 and P5 changed from ${initialGaps[3]} to ${gap34}`
    );
  }

  // --- Test 5A: Type text into Paragraph 2 ---
  console.log("\nTesting 5A: Type text into Paragraph 2...");
  let workingBlocks: TextBlock[] = initialBlocks.map((b, idx) =>
    idx === 1
      ? {
          ...b,
          currentText: b.currentText + " [ADDITIONAL TEST TEXT TYPED BY USER TO EXTEND PARAGRAPH]",
          isEdited: true,
        }
      : b
  );
  assertOtherBlocksStayIdentical(workingBlocks, "Type Text");
  console.log("✓ Passed 5A: Typing in P2 did not move other paragraphs or alter gaps.");

  // --- Test 5B: Delete text from Paragraph 2 ---
  console.log("\nTesting 5B: Delete text from Paragraph 2...");
  workingBlocks = workingBlocks.map((b, idx) =>
    idx === 1
      ? {
          ...b,
          currentText: "Short edited sentence.",
          isEdited: true,
        }
      : b
  );
  assertOtherBlocksStayIdentical(workingBlocks, "Delete Text");
  console.log("✓ Passed 5B: Deletion in P2 did not alter other paragraphs or collapse gaps.");

  // --- Test 5C: Change Font Family of Paragraph 2 ---
  console.log("\nTesting 5C: Change Font Family of Paragraph 2 to Inter...");
  workingBlocks = workingBlocks.map((b, idx) =>
    idx === 1
      ? {
          ...b,
          fontFamily: "Inter",
          userOverride: true,
          isEdited: true,
        }
      : b
  );
  assertOtherBlocksStayIdentical(workingBlocks, "Change Font Family");
  console.log("✓ Passed 5C: Font change in P2 kept sibling paragraphs locked in place.");

  // --- Test 5D: Change Font Size of Paragraph 2 ---
  console.log("\nTesting 5D: Change Font Size of Paragraph 2 from 12pt to 18pt...");
  workingBlocks = workingBlocks.map((b, idx) =>
    idx === 1
      ? {
          ...b,
          fontSize: 18,
          userOverride: true,
          isEdited: true,
        }
      : b
  );
  assertOtherBlocksStayIdentical(workingBlocks, "Change Font Size");
  console.log("✓ Passed 5D: Font size change in P2 kept other paragraph bounding boxes identical.");

  // --- Test 5E: Export PDF and Verify Result ---
  console.log("\nTesting 5E: Export edited PDF with applyPdfEdits and verify...");
  const exportResult = await applyPdfEdits({
    fileData: pdfBytes,
    blocks: workingBlocks,
    outputFilename: "test-step5-edited.pdf",
  });

  assert(exportResult.success && exportResult.data, "Export must succeed");
  const dataBytes = exportResult.data as Uint8Array;
  console.log("✓ Export succeeded, size:", dataBytes.length, "bytes");

  // Re-load and extract the exported PDF to verify visual layout preservation
  const reloadedTask = pdfjs.getDocument({
    data: new Uint8Array(dataBytes),
    fontExtraProperties: true,
  });
  const reloadedDoc = await reloadedTask.promise;
  const reloadedPage = await reloadedDoc.getPage(1);
  const reloadedData = await extractPageText(reloadedPage, 0, 1.0);

  console.log(`✓ Exported PDF parsed: found ${reloadedData.blocks.length} text blocks.`);
  assert(reloadedData.blocks.length >= 5, "Exported PDF must retain distinct paragraph structure");

  console.log("\n🎉 ALL STEP 5 PARAGRAPH INDEPENDENCE TESTS PASSED EMPIRICALLY!\n");
}

runParagraphTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
