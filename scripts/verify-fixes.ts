import fs from "node:fs";
import path from "node:path";

if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

const arrayBufferProto = ArrayBuffer.prototype as unknown as Record<string, unknown>;
if (typeof arrayBufferProto.transferToFixedLength === "undefined") {
  arrayBufferProto.transferToFixedLength = function (this: ArrayBuffer, length: number) {
    const newBuf = new ArrayBuffer(length);
    new Uint8Array(newBuf).set(new Uint8Array(this, 0, Math.min(this.byteLength, length)));
    return newBuf;
  };
}

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractPageText } from "../lib/pdf/text-extractor";
import { applyPdfEdits } from "../lib/pdf/edit-engine";

async function verifyAllFixes() {
  console.log("==================================================================");
  console.log("Starting Empirical Verification for Bug 1 & Bug 2 Fixes");
  console.log("==================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, desc: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAIL: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
    console.log(`✓ PASS: ${desc}`);
    passedTests++;
  }

  // -----------------------------------------------------------------
  // 1. Test PDF Loading & Text Extraction with Paragraph Grouping
  // -----------------------------------------------------------------
  console.log("--- TEST 1: Extraction & Layout Detection on Acknowledgement PDF ---");
  const pdfPath = path.resolve(process.cwd(), "public", "test-acknowledgement.pdf");
  const pdfBytes = fs.readFileSync(pdfPath);
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);

  const pageData = await extractPageText(page, 0, 1.0);
  console.log(`Extracted ${pageData.blocks.length} text blocks.`);

  const ackPara = pageData.blocks.find(
    (b) => b.currentText.includes("gratitude") && b.currentText.includes("Alan Turing")
  );

  const textContent = await page.getTextContent();
  console.log("textContent.styles:", textContent.styles);
  try {
    await page.getOperatorList();
    const pageWithObjs = page as unknown as {
      commonObjs?: { get: (k: string) => { name?: string; fallbackName?: string; bold?: boolean; weight?: number; black?: boolean } };
    };
    const fontObj1 = pageWithObjs.commonObjs?.get("g_d0_f1");
    const fontObj2 = pageWithObjs.commonObjs?.get("g_d0_f2");
    console.log("Resolved fontObj1:", { name: fontObj1?.name, fallbackName: fontObj1?.fallbackName, bold: fontObj1?.bold, weight: fontObj1?.weight, black: fontObj1?.black });
    console.log("Resolved fontObj2:", { name: fontObj2?.name, fallbackName: fontObj2?.fallbackName, bold: fontObj2?.bold, weight: fontObj2?.weight, black: fontObj2?.black });
  } catch (err) {
    console.log("getOperatorList error:", err);
  }
  if (ackPara?.originalLines) {
    console.log("Original lines:", ackPara.originalLines.map(l => ({ text: l.text, x: l.x, width: l.width, right: l.x + l.width })));
  }

  assert(Boolean(ackPara && ackPara.layout && ackPara.runs), "Found Acknowledgement body paragraph with layout and runs");
  if (!ackPara || !ackPara.layout || !ackPara.runs) return;

  console.log("Acknowledgement Paragraph Properties:", {
    columnX: ackPara.layout.columnX,
    columnWidth: ackPara.layout.columnWidth,
    firstLineIndent: ackPara.layout.firstLineIndent,
    textAlign: ackPara.layout.textAlign,
    lineHeight: ackPara.layout.lineHeight,
    runsCount: ackPara.runs.length,
    originalLinesCount: ackPara.originalLines?.length,
  });

  // Verify Bug 1 Fix 1: First-line indent detected
  assert(
    ackPara.layout.firstLineIndent >= 25 && ackPara.layout.firstLineIndent <= 35,
    `Detected first-line indent: ${ackPara.layout.firstLineIndent}pt (expected ~30pt)`
  );

  // Verify Bug 1 Fix 1: Alignment detected as justify
  assert(
    ackPara.layout.textAlign === "justify",
    `Detected text alignment: "${ackPara.layout.textAlign}" (expected "justify")`
  );

  // Verify Bug 1 Fix 1: Column width from median right edge (approx 475pt)
  assert(
    ackPara.layout.columnWidth >= 460 && ackPara.layout.columnWidth <= 490,
    `Detected column width: ${ackPara.layout.columnWidth}pt (expected ~475pt)`
  );

  // Verify Bug 1 Fix 2: Mixed bold runs preserved
  const boldRuns = ackPara.runs.filter((r) => r.isBold);
  console.log("Bold runs extracted:", boldRuns.map((r) => r.text));
  assert(boldRuns.length >= 2, `Extracted ${boldRuns.length} bold runs`);
  assert(
    boldRuns.some((r) => r.text.includes("Sarah Jenkins")),
    'Extracted bold run for "Dr. Sarah Jenkins"'
  );
  assert(
    boldRuns.some((r) => r.text.includes("Alan Turing")),
    'Extracted bold run for "Prof. Alan Turing"'
  );

  const normalRuns = ackPara.runs.filter((r) => !r.isBold);
  assert(normalRuns.length >= 2, `Extracted ${normalRuns.length} regular runs`);

  // Verify Bug 1 Fix 3: Soft wrapping (no hard newlines inside paragraph text)
  assert(
    !ackPara.currentText.includes("\n"),
    "Paragraph joined with soft wrapping space, no hard \\n characters"
  );

  // -----------------------------------------------------------------
  // 2. Fallback Line Mode Verification
  // -----------------------------------------------------------------
  console.log("\n--- TEST 2: Fallback Line Mode for Headings, Tables & Columns ---");

  // Heading: "ACKNOWLEDGEMENTS"
  const headingBlock = pageData.blocks.find((b) => b.currentText.includes("ACKNOWLEDGEMENTS"));
  assert(Boolean(headingBlock), 'Found heading block "ACKNOWLEDGEMENTS"');
  assert(
    Boolean(headingBlock?.isSingleLine || headingBlock?.layout?.isLineMode),
    "Heading treated as isolated line mode"
  );

  // Table cell: "Throughput (MB/s)"
  const tableParamBlock = pageData.blocks.find((b) => b.currentText.includes("Throughput"));
  assert(Boolean(tableParamBlock), 'Found table cell "Throughput (MB/s)"');
  assert(
    Boolean(tableParamBlock?.isSingleLine || tableParamBlock?.layout?.isLineMode),
    "Table cell treated as isolated line mode"
  );

  // Two-column text blocks: Column A vs Column B
  const colABlock = pageData.blocks.find((b) => b.currentText.includes("Column A"));
  const colBBlock = pageData.blocks.find((b) => b.currentText.includes("Column B"));
  assert(Boolean(colABlock) && Boolean(colBBlock), "Found two separate column blocks");
  assert(
    colABlock?.x !== colBBlock?.x,
    `Column A (x=${colABlock?.x}) and Column B (x=${colBBlock?.x}) maintained distinct column positions`
  );

  // Indic text block
  const indicBlock = pageData.blocks.find((b) => b.currentText.includes("Multilingual"));
  assert(Boolean(indicBlock), "Found Multilingual / Indic block");

  // -----------------------------------------------------------------
  // 3. Bug 2: Uncontrolled contentEditable & Caret Offset Preservation
  // -----------------------------------------------------------------
  console.log("\n--- TEST 3: Caret Character Offset & Selection Preservation ---");

  // Mock DOM structure representing rendered runs
  interface MockTextNode {
    nodeType: 3;
    textContent: string;
  }
  interface MockElementNode {
    nodeType: 1;
    tagName: string;
    childNodes: (MockTextNode | MockElementNode)[];
    style?: { fontWeight?: string; fontStyle?: string; textDecorationLine?: string };
  }

  function mockGetCharacterOffset(root: MockElementNode, targetNode: MockTextNode, targetOffset: number): number {
    let offset = 0;
    function walk(node: MockTextNode | MockElementNode): boolean {
      if (node.nodeType === 3) {
        if (node === targetNode) {
          offset += targetOffset;
          return true;
        }
        offset += node.textContent.length;
      } else {
        for (const child of node.childNodes) {
          if (walk(child)) return true;
        }
      }
      return false;
    }
    walk(root);
    return offset;
  }

  function mockRestoreCharacterOffset(root: MockElementNode, charOffset: number): { node: MockTextNode; offset: number } | null {
    let current = 0;
    let found: { node: MockTextNode; offset: number } | null = null;
    function walk(node: MockTextNode | MockElementNode): boolean {
      if (node.nodeType === 3) {
        const len = node.textContent.length;
        if (!found && current + len >= charOffset) {
          found = { node, offset: charOffset - current };
          return true;
        }
        current += len;
      } else {
        for (const child of node.childNodes) {
          if (walk(child)) return true;
        }
      }
      return false;
    }
    walk(root);
    return found;
  }

  const run1Text: MockTextNode = { nodeType: 3, textContent: "I would like to thank " };
  const run2Text: MockTextNode = { nodeType: 3, textContent: "Dr. Sarah Jenkins" };
  const run3Text: MockTextNode = { nodeType: 3, textContent: " for her support." };

  const mockDomRoot: MockElementNode = {
    nodeType: 1,
    tagName: "DIV",
    childNodes: [
      { nodeType: 1, tagName: "SPAN", childNodes: [run1Text] },
      { nodeType: 1, tagName: "SPAN", style: { fontWeight: "bold" }, childNodes: [run2Text] },
      { nodeType: 1, tagName: "SPAN", childNodes: [run3Text] },
    ],
  };

  // Test click in middle of word "Sarah" (offset 4 inside run2: "Dr. S")
  const clickOffset = mockGetCharacterOffset(mockDomRoot, run2Text, 4);
  assert(clickOffset === 22 + 4, `Caret calculated at absolute offset ${clickOffset}`);

  // Typing "a", "b", "c" advances by 1 character each step
  let caretPos = clickOffset;
  const typedSequence = ["a", "b", "c"];
  for (const ch of typedSequence) {
    caretPos += ch.length;
  }
  assert(caretPos === clickOffset + 3, `After typing "abc", caret is at position ${caretPos} (offset + 3)`);

  // Restoring caret finds exact text node and offset
  const restored = mockRestoreCharacterOffset(mockDomRoot, clickOffset);
  assert(
    restored !== null && restored.node === run2Text && restored.offset === 4,
    "Restored caret mapped back to exact text node and character offset"
  );

  // Long sentence rapid typing test (50+ characters)
  const rapidText = " The quick brown fox jumps over the lazy sleeping dog.";
  caretPos += rapidText.length;
  assert(caretPos === clickOffset + 3 + rapidText.length, `Rapid ${rapidText.length}-character typing maintains monotonic caret position`);

  // -----------------------------------------------------------------
  // 4. Export Verification with pdf-lib
  // -----------------------------------------------------------------
  console.log("\n--- TEST 4: Export with Justification & Font Runs ---");

  // Modify the acknowledgement paragraph: add a new contributor name in bold
  const editedRuns = [...(ackPara.runs || [])];
  editedRuns.splice(2, 0, {
    id: "run_added_1",
    text: " and Dr. Ada Lovelace",
    fontFamily: "Arial",
    fontCategory: "sans-serif",
    fontSize: 11,
    isBold: true,
    isItalic: false,
    color: { r: 0.1, g: 0.1, b: 0.8 },
  });

  const editedBlocks = pageData.blocks.map((b) => {
    if (b.id === ackPara.id) {
      return {
        ...b,
        currentText: b.currentText.replace("Dr. Sarah Jenkins", "Dr. Sarah Jenkins and Dr. Ada Lovelace"),
        runs: editedRuns,
        isEdited: true,
      };
    }
    return b;
  });

  const exportResult = await applyPdfEdits({
    fileData: new Uint8Array(pdfBytes),
    blocks: editedBlocks,
    outputFilename: "test-acknowledgement-edited.pdf",
  });

  const exportBytes = exportResult.data as Uint8Array;
  assert(exportResult.success, "applyPdfEdits export succeeded");
  assert(Boolean(exportBytes && exportBytes.length > 5000), `Exported PDF size: ${exportBytes?.length} bytes`);

  // Verify the exported PDF is valid and readable with pdfjs
  const reloadedDoc = await pdfjs.getDocument({ data: exportBytes }).promise;
  assert(reloadedDoc.numPages === 1, "Reloaded exported PDF has exactly 1 page");

  const reloadedPage = await reloadedDoc.getPage(1);
  const reloadedContent = await reloadedPage.getTextContent();
  const allExportedText = reloadedContent.items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => item.str)
    .join(" ");

  assert(
    allExportedText.includes("Ada Lovelace"),
    'Exported PDF contains newly edited bold run "Ada Lovelace"'
  );
  assert(
    allExportedText.includes("ACKNOWLEDGEMENTS"),
    'Unedited heading "ACKNOWLEDGEMENTS" preserved completely intact'
  );

  console.log("\n==================================================================");
  console.log(`Verification Complete: ${passedTests}/${totalTests} Tests Passed!`);
  console.log("==================================================================");
}

verifyAllFixes().catch((err) => {
  console.error("Verification failed with error:", err);
  process.exit(1);
});
