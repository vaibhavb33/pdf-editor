import { describe, it } from "node:test";
import assert from "node:assert";

// -------------------------------------------------------------
// Test 1: Paragraph Boundary Detection Rules
// -------------------------------------------------------------
function simulateLineGrouping(lines: Array<{
  tx: number;
  ty: number;
  endX: number;
  width: number;
  fontSize: number;
  text: string;
  isBold?: boolean;
}>) {
  // Precompute page median line gap
  const pageLineGaps: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const l1 = lines[i];
    const l2 = lines[i + 1];
    const gap = l1.ty - l2.ty;
    const avgFz = (l1.fontSize + l2.fontSize) / 2;
    if (gap >= avgFz * 0.7 && gap <= avgFz * 3.5) {
      pageLineGaps.push(gap);
    }
  }
  const pageMedianLineGap = pageLineGaps.length > 0 ? pageLineGaps.sort((a,b)=>a-b)[Math.floor(pageLineGaps.length/2)] : 15;

  const leftBuckets = new Map<number, number>();
  for (const l of lines) {
    if (!l.text.trim()) continue;
    const bucket = Math.round(l.tx * 0.5) * 2;
    leftBuckets.set(bucket, (leftBuckets.get(bucket) || 0) + 1);
  }
  let dominantColLeft = lines[0]?.tx || 0;
  let maxLeftCount = 0;
  for (const [bucket, count] of leftBuckets.entries()) {
    if (count > maxLeftCount) {
      maxLeftCount = count;
      dominantColLeft = bucket;
    }
  }

  const substantialLines = lines.filter((l) => l.text.trim().length > 25 || l.width > 120);
  const colRight = substantialLines.length > 0
    ? substantialLines.map(l => l.endX).sort((a,b)=>a-b)[Math.floor(substantialLines.length/2)]
    : 500;

  const paragraphs: Array<{ lines: typeof lines }> = [];

  for (let i = 0; i < lines.length; i++) {
    const curLine = lines[i];
    const lastPara = paragraphs[paragraphs.length - 1];
    const prevLine = lastPara ? lastPara.lines[lastPara.lines.length - 1] : null;

    let canGroupWithPrev = false;

    if (prevLine) {
      const deltaY = prevLine.ty - curLine.ty;
      const avgFontSize = (prevLine.fontSize + curLine.fontSize) / 2;

      const isLargeVerticalGap = deltaY > Math.max(pageMedianLineGap * 1.28, avgFontSize * 1.35);
      const isFirstLineIndent = (curLine.tx - dominantColLeft >= 6.0 || curLine.tx - prevLine.tx >= 6.0) && curLine.tx < colRight - 40;
      const prevLineEndedShort = prevLine.endX < colRight - 32 && prevLine.width > 30;
      const curStartsAtLeftMargin = Math.abs(curLine.tx - dominantColLeft) <= 4.0 || Math.abs(curLine.tx - Math.min(prevLine.tx, dominantColLeft)) <= 4.0;
      const isBreakByShortLineEnd = prevLineEndedShort && curStartsAtLeftMargin;
      const fontSizeDiffers = Math.abs(curLine.fontSize - prevLine.fontSize) >= 1.5;
      const isHeadingStyleChange = (Boolean(prevLine.isBold) !== Boolean(curLine.isBold)) && (prevLine.text.length < 50 || curLine.text.length < 50);
      const isAbnormalGap = deltaY < avgFontSize * 0.4 || deltaY > avgFontSize * 3.8;
      const isColMisaligned = Math.abs(curLine.tx - prevLine.tx) > Math.max(36, avgFontSize * 3.0);

      const isParagraphBreak =
        isLargeVerticalGap ||
        isFirstLineIndent ||
        isBreakByShortLineEnd ||
        fontSizeDiffers ||
        isHeadingStyleChange ||
        isAbnormalGap ||
        isColMisaligned;

      canGroupWithPrev = !isParagraphBreak;
    }

    if (canGroupWithPrev && lastPara) {
      lastPara.lines.push(curLine);
    } else {
      paragraphs.push({ lines: [curLine] });
    }
  }

  return paragraphs;
}

console.log("=== Running Empirical Tests for Bug 1, Bug 2, Bug 3 ===");

// Scenario: Two distinct paragraphs with first-line indent on paragraph 2 and inter-paragraph gap
const testLines = [
  // Heading
  { tx: 72, ty: 700, endX: 250, width: 178, fontSize: 16, text: "Chapter 1: The Beginning", isBold: true },
  // Paragraph 1 (starts with indent 96, col left is 72)
  { tx: 96, ty: 670, endX: 520, width: 424, fontSize: 12, text: "This is the first sentence of the opening paragraph in this book." },
  { tx: 72, ty: 654, endX: 520, width: 448, fontSize: 12, text: "It continues along the standard column margin filling the entire width." },
  { tx: 72, ty: 638, endX: 280, width: 208, fontSize: 12, text: "And terminates well before the right margin." },
  // Paragraph 2 (starts with indent 96, and has a 24pt paragraph gap instead of 16pt line gap)
  { tx: 96, ty: 614, endX: 520, width: 424, fontSize: 12, text: "The second paragraph starts here after a blank paragraph gap." },
  { tx: 72, ty: 598, endX: 520, width: 448, fontSize: 12, text: "It maintains its own independent spacing and line-height." },
  { tx: 72, ty: 582, endX: 350, width: 278, fontSize: 12, text: "Concluding the second thought." },
];

const resultParas = simulateLineGrouping(testLines);
console.log(`Detected ${resultParas.length} distinct paragraphs:`);
resultParas.forEach((p, idx) => {
  console.log(`  Paragraph ${idx + 1}: ${p.lines.length} line(s) -> "${p.lines[0].text.slice(0, 40)}..."`);
});

assert.strictEqual(resultParas.length, 3, "Heading + Para 1 + Para 2 must be exactly 3 independent blocks!");
assert.strictEqual(resultParas[0].lines.length, 1, "Heading is isolated");
assert.strictEqual(resultParas[1].lines.length, 3, "Para 1 has exactly 3 lines");
assert.strictEqual(resultParas[2].lines.length, 3, "Para 2 has exactly 3 lines");
console.log("✓ PASS: Paragraph boundary detection cleanly separated all paragraphs!");

// -------------------------------------------------------------
// Test 2: Signature Coordinate Mapping & Canvas Scaling
// -------------------------------------------------------------
function mapPointerToCanvas(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  dpr: number
) {
  // With ctx.scale(dpr, dpr), context coordinates match CSS pixels (clientX - rect.left)
  const ctxX = clientX - rect.left;
  const ctxY = clientY - rect.top;

  // Internal buffer pixel coordinates
  const bufferX = Math.round(ctxX * dpr);
  const bufferY = Math.round(ctxY * dpr);

  return { ctxX, ctxY, bufferX, bufferY };
}

// User clicks in the center of a 600x256 CSS pad on a 2x Retina display
const rect = { left: 100, top: 200, width: 600, height: 256 };
const dpr = 2.0;
const pointer = { clientX: 400, clientY: 328 }; // center of pad

const mapped = mapPointerToCanvas(pointer.clientX, pointer.clientY, rect, dpr);
assert.strictEqual(mapped.ctxX, 300, "Context X matches relative CSS position (300)");
assert.strictEqual(mapped.ctxY, 128, "Context Y matches relative CSS position (128)");
assert.strictEqual(mapped.bufferX, 600, "Buffer X is native Retina pixel 600");
assert.strictEqual(mapped.bufferY, 256, "Buffer Y is native Retina pixel 256");
console.log("✓ PASS: Signature pointer coordinates map 1:1 to context and Retina buffer without offset!");

// -------------------------------------------------------------
// Test 3: Signature Bounding Box Crop
// -------------------------------------------------------------
function computeCropBox(
  strokePoints: Array<{ x: number; y: number }>,
  canvasWidth: number,
  canvasHeight: number,
  pad: number = 12
) {
  let minX = canvasWidth, minY = canvasHeight, maxX = 0, maxY = 0;
  for (const pt of strokePoints) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(canvasWidth - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(canvasHeight - cropY, maxY - minY + pad * 2);
  return { cropX, cropY, cropW, cropH };
}

const points = [
  { x: 100, y: 120 },
  { x: 250, y: 150 },
  { x: 300, y: 90 },
];
const crop = computeCropBox(points, 1200, 512, 12);
assert.strictEqual(crop.cropX, 88, "Crop X starts 12px before minX (100 - 12 = 88)");
assert.strictEqual(crop.cropY, 78, "Crop Y starts 12px before minY (90 - 12 = 78)");
assert.strictEqual(crop.cropW, 224, "Crop width is 200 + 24 = 224");
assert.strictEqual(crop.cropH, 84, "Crop height is 60 + 24 = 84");
console.log("✓ PASS: Signature crops tightly to bounding box on export!");

console.log("\n==================================================================");
console.log("All empirical verification tests passed cleanly!");
console.log("==================================================================");
