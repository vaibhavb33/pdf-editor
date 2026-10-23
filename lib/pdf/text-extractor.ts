import {
  TextBlock,
  PageTextData,
  FontChoice,
  OriginalLine,
  TextRun,
  ParagraphLayout,
  TextAlignment,
  FontDetectionMetadata,
} from "./edit-types";
import { resolveFontDisplayInfo } from "./font-matcher";
import {
  matchFontInCatalog,
  normalizePdfFontName,
} from "./font-catalog";

interface RawTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
  fontName: string;
  hasEOL: boolean;
}

/**
 * Strips 6-character subset tag like "ABCDEF+Arial" -> "Arial".
 */
export function cleanFontName(rawName: string): string {
  if (!rawName) return "Helvetica";
  return rawName.replace(/^[A-Z]{6}\+/, "").replace(/[,_]/g, "-");
}

/**
 * Parses font family, weight, style, and category from PDF font names.
 */
export function parseFontDetails(
  rawFontName: string,
  styleFontFamily?: string
): {
  fontFamily: string;
  fontCategory: FontChoice;
  isBold: boolean;
  isItalic: boolean;
} {
  const cleaned = cleanFontName(rawFontName);
  const combined = `${cleaned} ${styleFontFamily || ""}`.toLowerCase();

  const isBold =
    combined.includes("bold") ||
    combined.includes("black") ||
    combined.includes("heavy") ||
    combined.includes("semibold") ||
    combined.includes("demi") ||
    combined.includes("700") ||
    combined.includes("800");

  const isItalic =
    combined.includes("italic") ||
    combined.includes("oblique") ||
    combined.includes("slanted") ||
    combined.includes("kursiv");

  let fontCategory: FontChoice = "sans-serif";
  let fontFamily = "Arial";

  if (combined.includes("calibri") || combined.includes("carlito")) {
    fontCategory = "calibri";
    fontFamily = "Calibri";
  } else if (combined.includes("cambria") || combined.includes("caladea")) {
    fontCategory = "cambria";
    fontFamily = "Cambria";
  } else if (
    combined.includes("times") ||
    combined.includes("serif") ||
    combined.includes("roman") ||
    combined.includes("georgia") ||
    combined.includes("garamond") ||
    combined.includes("cmr")
  ) {
    fontCategory = "serif";
    fontFamily = "Times New Roman";
  } else if (
    combined.includes("courier") ||
    combined.includes("mono") ||
    combined.includes("consolas") ||
    combined.includes("menlo")
  ) {
    fontCategory = "monospace";
    fontFamily = "Courier New";
  } else if (combined.includes("deva") || combined.includes("hindi") || combined.includes("mangal")) {
    fontCategory = "devanagari";
    fontFamily = "Noto Sans Devanagari";
  } else if (combined.includes("guj") || combined.includes("shruti")) {
    fontCategory = "gujarati";
    fontFamily = "Noto Sans Gujarati";
  } else if (combined.includes("roboto")) {
    fontCategory = "roboto";
    fontFamily = "Roboto";
  } else {
    fontCategory = "sans-serif";
    fontFamily = cleaned.replace(/-?(bold|italic|regular|mt|ps|psmt).*/i, "").trim() || "Arial";
  }

  return { fontFamily, fontCategory, isBold, isItalic };
}

interface ProcessedRawItem {
  str: string;
  tx: number;
  ty: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontCategory: FontChoice;
  rawFontName: string;
  isBold: boolean;
  isItalic: boolean;
  embeddedFontFamily?: string;
  detection?: FontDetectionMetadata;
}

interface LineRunItem {
  runs: TextRun[];
  tx: number;
  ty: number;
  endX: number;
  width: number;
  height: number;
  fontSize: number;
  text: string;
}

/**
 * Calculates median of an array of numbers.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Extracts and groups text items into paragraphs with runs, indents, justification, and line-height.
 */
export async function extractPageText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfPage: any,
  pageIndex: number,
  scale = 1.0
): Promise<PageTextData> {
  const viewport = pdfPage.getViewport({ scale });
  const textContent = await pdfPage.getTextContent({ includeMarkedContent: true });
  const styles = textContent.styles || {};

  try {
    await pdfPage.getOperatorList();
  } catch {
    // ignore
  }

  const rawItems: ProcessedRawItem[] = [];

  for (const raw of textContent.items) {
    if (!raw || typeof raw.str !== "string" || raw.str === "") {
      continue;
    }
    const item = raw as RawTextItem;
    const transform = item.transform;
    const tx = transform[4];
    const ty = transform[5];

    // Compute font size in PDF points from transform matrix
    const fontSize = Math.max(
      6,
      Math.round(Math.hypot(transform[0], transform[1]) * 10) / 10
    );

    // Retrieve resolved font object from commonObjs if available
    const fontObj = pdfPage.commonObjs?.has?.(item.fontName)
      ? pdfPage.commonObjs.get(item.fontName)
      : null;

    const style = styles[item.fontName] || {};
    const rawFontLookup = fontObj?.name || fontObj?.loadedName || item.fontName || "";
    const styleFamily = style.fontFamily || "";

    // Register embedded font data as FontFace in browser if available
    let embeddedFontFamily: string | undefined;
    if (typeof window !== "undefined" && typeof FontFace !== "undefined" && fontObj?.data) {
      try {
        const safeName = (item.fontName || "f").replace(/[^a-zA-Z0-9_-]/g, "");
        const fontKey = `pdf-emb-${pageIndex}-${safeName}`;
        if (!document.fonts.check(`12px "${fontKey}"`)) {
          const rawBuffer = fontObj.data.buffer
            ? fontObj.data.buffer.slice(
                fontObj.data.byteOffset,
                fontObj.data.byteOffset + fontObj.data.byteLength
              )
            : fontObj.data;
          const fontFace = new FontFace(fontKey, rawBuffer);
          fontFace
            .load()
            .then((loaded) => {
              document.fonts.add(loaded);
            })
            .catch(() => {
              // unsupported format or subset
            });
          embeddedFontFamily = fontKey;
        } else {
          embeddedFontFamily = fontKey;
        }
      } catch {
        // ignore FontFace load errors
      }
    }

    // Match font in standardized catalog
    const match = matchFontInCatalog(rawFontLookup, styleFamily, {
      isSerif: Boolean(fontObj?.serif),
      isMonospace: Boolean(fontObj?.monospace),
      isBold: Boolean(fontObj?.bold || fontObj?.black),
      isItalic: Boolean(fontObj?.italic),
    });

    const norm = normalizePdfFontName(rawFontLookup);
    const isBold = Boolean(fontObj?.bold || fontObj?.black || norm.isBold);
    const isItalic = Boolean(fontObj?.italic || norm.isItalic);

    let detectedFamily = match.detectedFamily;
    let mappedFamily = match.mappedFamily;
    let detectedCategory: FontChoice = match.fontCategory;
    let isExact = match.isExact;
    let confidence = match.confidence;

    // Indic script check from character codes
    if (/[\u0900-\u097F]/.test(item.str)) {
      detectedCategory = "devanagari";
      detectedFamily = "Noto Sans Devanagari";
      mappedFamily = "Noto Sans Devanagari";
      isExact = true;
      confidence = 1.0;
    } else if (/[\u0A80-\u0AFF]/.test(item.str)) {
      detectedCategory = "gujarati";
      detectedFamily = "Noto Sans Gujarati";
      mappedFamily = "Noto Sans Gujarati";
      isExact = true;
      confidence = 1.0;
    } else if (/[\u0B80-\u0BFF]/.test(item.str)) {
      detectedCategory = "sans-serif";
      detectedFamily = "Noto Sans Tamil";
      mappedFamily = "Noto Sans Tamil";
      isExact = true;
      confidence = 1.0;
    } else if (/[\u0980-\u09FF]/.test(item.str)) {
      detectedCategory = "sans-serif";
      detectedFamily = "Noto Sans Bengali";
      mappedFamily = "Noto Sans Bengali";
      isExact = true;
      confidence = 1.0;
    }

    const detection: FontDetectionMetadata = {
      rawName: rawFontLookup,
      normalizedFamily: detectedFamily,
      mappedFont: mappedFamily,
      isExact,
      confidence,
      flags: {
        isSerif: Boolean(fontObj?.serif || norm.isSerif),
        isMonospace: Boolean(fontObj?.monospace || norm.isMonospace),
        isBold,
        isItalic,
      },
    };

    const itemWidth = Math.max(item.width, fontSize * 0.4 * item.str.length);
    const itemHeight = Math.max(item.height || fontSize, fontSize * 1.15);

    rawItems.push({
      str: item.str,
      tx,
      ty,
      width: itemWidth,
      height: itemHeight,
      fontSize,
      fontFamily: detectedFamily,
      fontCategory: detectedCategory,
      rawFontName: rawFontLookup,
      isBold,
      isItalic,
      embeddedFontFamily,
      detection,
    });
  }

  // Sort raw items: top-to-bottom (ty descending), then left-to-right (tx ascending)
  rawItems.sort((a, b) => {
    const yDiff = b.ty - a.ty;
    if (Math.abs(yDiff) > Math.min(a.fontSize, b.fontSize) * 0.35) {
      return yDiff;
    }
    return a.tx - b.tx;
  });

  // Step 1: Merge raw items on the same baseline into lines, preserving individual formatted runs
  const lines: LineRunItem[] = [];

  for (const item of rawItems) {
    const lastLine = lines[lines.length - 1];

    const canJoinLine =
      lastLine &&
      Math.abs(item.ty - lastLine.ty) < Math.max(2, item.fontSize * 0.25) &&
      item.tx >= lastLine.tx - 2 &&
      item.tx <= lastLine.endX + Math.max(item.fontSize * 1.8, 16);

    const newRun: TextRun = {
      id: `run_${pageIndex}_${Math.random().toString(36).slice(2, 8)}`,
      text: item.str,
      fontFamily: item.fontFamily,
      fontCategory: item.fontCategory,
      fontSize: item.fontSize,
      isBold: item.isBold,
      isItalic: item.isItalic,
      isUnderline: false,
      color: { r: 0.1, g: 0.1, b: 0.1 },
      embeddedFontFamily: item.embeddedFontFamily,
    };

    if (canJoinLine && lastLine) {
      const needsSpace =
        item.tx > lastLine.endX + item.fontSize * 0.12 &&
        !lastLine.text.endsWith(" ") &&
        !item.str.startsWith(" ");

      const lastRun = lastLine.runs[lastLine.runs.length - 1];
      const sameStyle =
        lastRun &&
        lastRun.fontCategory === item.fontCategory &&
        lastRun.isBold === item.isBold &&
        lastRun.isItalic === item.isItalic &&
        Math.abs(lastRun.fontSize - item.fontSize) < 0.5;

      if (sameStyle && lastRun) {
        lastRun.text += (needsSpace ? " " : "") + item.str;
      } else {
        if (needsSpace && lastRun) {
          lastRun.text += " ";
        }
        lastLine.runs.push(newRun);
      }

      lastLine.text += (needsSpace ? " " : "") + item.str;
      lastLine.endX = Math.max(lastLine.endX, item.tx + item.width);
      lastLine.width = lastLine.endX - lastLine.tx;
    } else {
      lines.push({
        runs: [newRun],
        tx: item.tx,
        ty: item.ty,
        endX: item.tx + item.width,
        width: item.width,
        height: item.height,
        fontSize: item.fontSize,
        text: item.str,
      });
    }
  }

  // Step 2: Detect paragraph boundaries BEFORE merging lines.
  // Start a new paragraph when any of these is true:
  // 1. Vertical gap > 1.28x page median line gap (or > 1.35x avg font size)
  // 2. Next line has a first-line indent (indent relative to column left)
  // 3. Previous line ended well short of the right edge of the column and next line starts at left margin
  // 4. Font size or heading style changes for the whole line
  // 5. Significant horizontal jump or abnormal vertical gap

  // Precompute page median line gap from consecutive lines
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
  const pageMedianLineGap =
    pageLineGaps.length > 0 ? median(pageLineGaps) : (lines[0]?.fontSize || 12) * 1.25;

  // Identify the dominant column left margin on the page
  const leftBuckets = new Map<number, number>();
  for (const l of lines) {
    if (!l.text.trim()) continue;
    const bucket = Math.round(l.tx * 0.5) * 2; // cluster within 2pt
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

  // Identify column right edge from the widest substantial lines on the page
  const substantialLines = lines.filter((l) => l.text.trim().length > 25 || l.width > 120);
  const colRight =
    substantialLines.length > 0
      ? Math.max(...substantialLines.map((l) => l.endX))
      : Math.max(...lines.map((l) => l.endX), dominantColLeft + 200);

  interface RawParagraph {
    lines: LineRunItem[];
    isLineMode: boolean;
  }

  const paragraphs: RawParagraph[] = [];

  for (let i = 0; i < lines.length; i++) {
    const curLine = lines[i];
    const lastPara = paragraphs[paragraphs.length - 1];
    const prevLine = lastPara ? lastPara.lines[lastPara.lines.length - 1] : null;

    let canGroupWithPrev = false;

    if (prevLine && !lastPara.isLineMode) {
      const deltaY = prevLine.ty - curLine.ty;
      const avgFontSize = (prevLine.fontSize + curLine.fontSize) / 2;

      // Rule 1: Vertical gap is clearly larger than normal line height
      const isLargeVerticalGap = deltaY > Math.max(pageMedianLineGap * 1.25, avgFontSize * 1.35);

      // Rule 2: Next line has a first-line indent
      // (curLine starts further right than dominant column margin AND previous line by >= 6pt)
      const isFirstLineIndent =
        curLine.tx - dominantColLeft >= 6.0 &&
        curLine.tx - prevLine.tx >= 6.0 &&
        curLine.tx < colRight - 40;

      // Rule 3: Previous line ended well short of column right edge AND vertical gap indicates a break
      const prevLineEndedShort = prevLine.endX < colRight - 45 && prevLine.width > 30;
      const verticalGapIndicatesBreak = deltaY > pageMedianLineGap * 1.15;
      const isBreakByShortLineEnd = prevLineEndedShort && verticalGapIndicatesBreak;

      // Rule 4: Font size or heading/bold weight changes for the whole line
      const fontSizeDiffers = Math.abs(curLine.fontSize - prevLine.fontSize) >= 1.5;
      const prevIsAllBold = prevLine.runs.every((r) => r.isBold);
      const curIsAllBold = curLine.runs.every((r) => r.isBold);
      const isHeadingStyleChange =
        prevIsAllBold !== curIsAllBold && (prevLine.text.length < 50 || curLine.text.length < 50);

      // Rule 5: Abnormal vertical gap (negative deltaY or distant lines)
      const isAbnormalGap = deltaY < avgFontSize * 0.4 || deltaY > avgFontSize * 3.8;

      // Rule 6: Horizontal distance (not an indent)
      const isColMisaligned = Math.abs(curLine.tx - prevLine.tx) > Math.max(36, avgFontSize * 3.0);

      const isParagraphBreak =
        isLargeVerticalGap ||
        isFirstLineIndent ||
        isBreakByShortLineEnd ||
        fontSizeDiffers ||
        isHeadingStyleChange ||
        isAbnormalGap ||
        isColMisaligned;

      // Merging condition: must NOT trigger any paragraph break rule
      canGroupWithPrev = !isParagraphBreak;
    }

    if (canGroupWithPrev && lastPara) {
      lastPara.lines.push(curLine);
    } else {
      paragraphs.push({
        lines: [curLine],
        isLineMode: false,
      });
    }
  }

  // Step 3: Compute Layout (columnWidth, firstLineIndent, textAlign, lineHeight) for each paragraph
  const blocks: TextBlock[] = paragraphs.map((para, idx) => {
    const pLines = para.lines;
    const isSingleLine = pLines.length === 1;

    // Detect column left edge:
    // If multi-line, column left edge is the minimum of lines 2..N (or median left edge of non-first lines)
    let columnX = pLines[0].tx;
    let firstLineIndent = 0;

    if (!isSingleLine && pLines.length > 1) {
      const nonFirstLefts = pLines.slice(1).map((l) => l.tx);
      const medianLeft = median(nonFirstLefts);
      columnX = medianLeft;

      const rawIndent = pLines[0].tx - columnX;
      // If indent is more than 3pt, consider it a real first-line indent
      if (Math.abs(rawIndent) >= 3.0) {
        firstLineIndent = Math.round(rawIndent * 10) / 10;
      }
    }

    // Detect column right edge and width:
    // If multi-line, exclude the last line since paragraphs often end early
    let columnWidth: number;
    let medianRight: number;

    if (isSingleLine) {
      columnWidth = pLines[0].width;
      medianRight = pLines[0].endX;
    } else {
      const nonLastRights = pLines.slice(0, pLines.length - 1).map((l) => l.endX);
      medianRight = median(nonLastRights);
      columnWidth = Math.max(40, medianRight - columnX);
    }

    // Detect Text Alignment (justify, center, right, left)
    let textAlign: TextAlignment = "left";

    if (!isSingleLine && pLines.length >= 2) {
      const nonLastRights = pLines.slice(0, pLines.length - 1).map((l) => l.endX);
      const rightDifferences = nonLastRights.map((r) => Math.abs(r - medianRight));
      const maxRightDiff = Math.max(...rightDifferences);

      // If all non-last lines have right edges matching within 3.5pt, the paragraph is JUSTIFIED!
      if (maxRightDiff <= 3.5) {
        textAlign = "justify";
      } else {
        // Check center alignment
        const centers = pLines.map((l) => (l.tx + l.endX) / 2);
        const medianCenter = median(centers);
        const centerDifferences = centers.map((c) => Math.abs(c - medianCenter));
        if (Math.max(...centerDifferences) <= 3.0) {
          textAlign = "center";
        } else {
          // Check right alignment (all lines right flush)
          const allRights = pLines.map((l) => l.endX);
          const allRightDiffs = allRights.map((r) => Math.abs(r - medianRight));
          if (Math.max(...allRightDiffs) <= 3.0) {
            textAlign = "right";
          }
        }
      }
    }

    // Detect median line-height (baseline delta Y)
    let baselineLineHeight = pLines[0].fontSize * 1.25;
    if (pLines.length >= 2) {
      const deltas: number[] = [];
      for (let i = 0; i < pLines.length - 1; i++) {
        deltas.push(pLines[i].ty - pLines[i + 1].ty);
      }
      baselineLineHeight = median(deltas);
    }

    // Soft paragraph text: Join lines with single space ' ' (NEVER hard \n)
    // Merge runs across all lines in the paragraph
    const combinedRuns: TextRun[] = [];
    const originalLines: OriginalLine[] = [];
    const textParts: string[] = [];

    for (let lIdx = 0; lIdx < pLines.length; lIdx++) {
      const line = pLines[lIdx];
      const lWidth = Math.max(line.width, line.fontSize * 0.45 * line.text.length);
      const lHeight = line.fontSize * 1.25;
      const lY = line.ty - line.fontSize * 0.25;

      originalLines.push({
        text: line.text,
        x: line.tx,
        y: lY,
        width: lWidth,
        height: lHeight,
        runs: line.runs,
      });

      textParts.push(line.text);

      for (let rIdx = 0; rIdx < line.runs.length; rIdx++) {
        const run = line.runs[rIdx];
        const isLastRunOfLine = rIdx === line.runs.length - 1;
        const isNotLastLineOfPara = lIdx < pLines.length - 1;
        const endsWithHyphen = run.text.endsWith("-") || run.text.endsWith("\u2010");
        const needsSpace = isLastRunOfLine && isNotLastLineOfPara && !isSingleLine && !endsWithHyphen && !run.text.endsWith(" ");
        const runText = run.text + (needsSpace ? " " : "");

        const prevCombined = combinedRuns[combinedRuns.length - 1];
        if (
          prevCombined &&
          prevCombined.isBold === run.isBold &&
          prevCombined.isItalic === run.isItalic &&
          prevCombined.isUnderline === run.isUnderline &&
          prevCombined.fontCategory === run.fontCategory &&
          Math.abs(prevCombined.fontSize - run.fontSize) < 0.5
        ) {
          prevCombined.text += runText;
        } else {
          combinedRuns.push({
            ...run,
            text: runText,
          });
        }
      }
    }

    const fullOriginalText = combinedRuns.map((r) => r.text).join("");

    // Union bounds in PDF coordinates
    let minX = columnX;
    let maxX = columnX + columnWidth;
    if (firstLineIndent < 0) minX = Math.min(minX, columnX + firstLineIndent);
    if (firstLineIndent > 0) maxX = Math.max(maxX, columnX + columnWidth);

    const topBaseline = pLines[0].ty;
    const bottomBaseline = pLines[pLines.length - 1].ty;
    const totalHeight = topBaseline - bottomBaseline + pLines[pLines.length - 1].fontSize * 1.25;
    const minY = bottomBaseline - pLines[pLines.length - 1].fontSize * 0.25;

    const pdfBounds = {
      x: minX,
      y: minY,
      width: Math.max(30, maxX - minX),
      height: Math.max(16, totalHeight),
    };

    // Calculate viewport CSS pixels using PDF.js viewport conversion
    const [left, bottom] = viewport.convertToViewportPoint(pdfBounds.x, pdfBounds.y);
    const [right, top] = viewport.convertToViewportPoint(
      pdfBounds.x + pdfBounds.width,
      pdfBounds.y + pdfBounds.height
    );

    const vLeft = Math.round(Math.min(left, right));
    const vTop = Math.round(Math.min(top, bottom));
    const vWidth = Math.max(24, Math.round(Math.abs(right - left)));
    const vHeight = Math.max(14, Math.round(Math.abs(bottom - top)));

    const dominantRun = combinedRuns[0] || {
      fontFamily: "Arial",
      fontCategory: "sans-serif" as FontChoice,
      fontSize: 12,
      isBold: false,
      isItalic: false,
    };

    const fontInfo = resolveFontDisplayInfo(dominantRun.fontFamily, dominantRun.fontFamily, dominantRun.fontCategory);
    const dominantRaw = rawItems.find((r) => r.str.includes(dominantRun.text.slice(0, 5))) || rawItems[0];
    const detection = dominantRaw?.detection;
    const isSubstituted = Boolean(detection ? !detection.isExact : fontInfo.isSubstitute);
    const substitutedName = detection ? detection.mappedFont : fontInfo.substitutedFontName;

    let paragraphSpacing: number | undefined;
    if (idx < paragraphs.length - 1) {
      const nextTopBaseline = paragraphs[idx + 1].lines[0].ty;
      const rawGap = bottomBaseline - nextTopBaseline;
      if (rawGap > 0) {
        paragraphSpacing = Math.round(rawGap * 10) / 10;
      }
    }

    const layout: ParagraphLayout = {
      columnX,
      columnWidth,
      firstLineIndent,
      lineHeight: baselineLineHeight,
      textAlign,
      isLineMode: isSingleLine,
      paragraphSpacing,
    };

    return {
      id: `block_p${pageIndex}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      pageIndex,
      originalText: fullOriginalText,
      currentText: fullOriginalText,
      x: columnX,
      y: topBaseline,
      pdfBounds,
      originalLines,
      runs: combinedRuns,
      layout,
      viewportBounds: {
        left: vLeft,
        top: vTop,
        width: vWidth,
        height: vHeight,
      },
      fontSize: dominantRun.fontSize,
      fontFamily: dominantRun.fontFamily,
      fontCategory: dominantRun.fontCategory,
      fontName: detection?.rawName || dominantRun.fontFamily,
      isSubstitutedFont: isSubstituted,
      substitutedFontName: substitutedName,
      detection,
      embeddedFontFamily: dominantRun.embeddedFontFamily,
      isBold: dominantRun.isBold,
      isItalic: dominantRun.isItalic,
      isUnderline: false,
      textAlign,
      isSingleLine,
      lineHeight: Math.round((baselineLineHeight / dominantRun.fontSize) * 100) / 100,
      color: { r: 0.1, g: 0.1, b: 0.1 },
      bgColor: { r: 1, g: 1, b: 1 },
    };
  });

  return {
    pageIndex,
    width: viewport.width / scale,
    height: viewport.height / scale,
    rotate: pdfPage.rotate || 0,
    blocks,
    hasText: blocks.length > 0,
  };
}

/**
 * Samples the background color around a text block on the rendered canvas.
 */
export function sampleBackgroundColor(
  ctx: CanvasRenderingContext2D,
  box: { left: number; top: number; width: number; height: number },
  dpr = 1
): { r: number; g: number; b: number } {
  try {
    const sx = Math.max(0, Math.floor((box.left - 2) * dpr));
    const sy = Math.max(0, Math.floor((box.top - 2) * dpr));
    const sw = Math.min(ctx.canvas.width - sx, Math.floor((box.width + 4) * dpr));
    const sh = Math.min(ctx.canvas.height - sy, Math.floor((box.height + 4) * dpr));

    if (sw <= 0 || sh <= 0) {
      return { r: 1, g: 1, b: 1 };
    }

    const imgData = ctx.getImageData(sx, sy, Math.min(sw, 40), Math.min(sh, 40)).data;
    const cornerOffsets = [
      0,
      (Math.min(sw, 40) - 1) * 4,
      ((Math.min(sh, 40) - 1) * Math.min(sw, 40)) * 4,
      ((Math.min(sh, 40) - 1) * Math.min(sw, 40) + Math.min(sw, 40) - 1) * 4,
    ];

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    for (const offset of cornerOffsets) {
      if (offset >= 0 && offset + 2 < imgData.length) {
        if (imgData[offset + 3] > 100) {
          rSum += imgData[offset];
          gSum += imgData[offset + 1];
          bSum += imgData[offset + 2];
          count++;
        }
      }
    }

    if (count > 0) {
      return {
        r: Math.round((rSum / count / 255) * 100) / 100,
        g: Math.round((gSum / count / 255) * 100) / 100,
        b: Math.round((bSum / count / 255) * 100) / 100,
      };
    }
  } catch {
    // fallback
  }

  return { r: 1, g: 1, b: 1 };
}

/**
 * Samples glyph pixels inside the bounding box to detect the true text color.
 * Picks the darkest/most prominent color contrasting with the background.
 */
export function sampleTextColor(
  ctx: CanvasRenderingContext2D,
  box: { left: number; top: number; width: number; height: number },
  bg: { r: number; g: number; b: number },
  dpr = 1
): { r: number; g: number; b: number } {
  try {
    const sx = Math.max(0, Math.floor(box.left * dpr));
    const sy = Math.max(0, Math.floor(box.top * dpr));
    const sw = Math.min(ctx.canvas.width - sx, Math.floor(box.width * dpr));
    const sh = Math.min(ctx.canvas.height - sy, Math.floor(box.height * dpr));

    if (sw <= 0 || sh <= 0) {
      return { r: 0.1, g: 0.1, b: 0.1 };
    }

    const sampleW = Math.min(sw, 60);
    const sampleH = Math.min(sh, 40);
    const data = ctx.getImageData(sx, sy, sampleW, sampleH).data;

    let darkestLuminance = Infinity;
    let bestR = 0.1;
    let bestG = 0.1;
    let bestB = 0.1;
    let foundTextPixel = false;

    const bgR255 = bg.r * 255;
    const bgG255 = bg.g * 255;
    const bgB255 = bg.b * 255;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 150) continue;

      const dist = Math.hypot(r - bgR255, g - bgG255, b - bgB255);
      if (dist > 40) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < darkestLuminance) {
          darkestLuminance = lum;
          bestR = r / 255;
          bestG = g / 255;
          bestB = b / 255;
          foundTextPixel = true;
        }
      }
    }

    if (foundTextPixel) {
      return {
        r: Math.round(bestR * 100) / 100,
        g: Math.round(bestG * 100) / 100,
        b: Math.round(bestB * 100) / 100,
      };
    }
  } catch {
    // fallback
  }

  return { r: 0.1, g: 0.1, b: 0.1 };
}

/**
 * Finds the nearest text block to inherit style when clicking in empty space.
 */
export function findNearestBlockStyle(
  blocks: TextBlock[],
  clickPdfX: number,
  clickPdfY: number
): {
  fontFamily: string;
  fontCategory: FontChoice;
  fontSize: number;
  color: { r: number; g: number; b: number };
} {
  const activeBlocks = blocks.filter((b) => !b.isDeleted && b.currentText.trim() !== "");
  if (activeBlocks.length === 0) {
    return {
      fontFamily: "Arial",
      fontCategory: "sans-serif",
      fontSize: 12,
      color: { r: 0.1, g: 0.1, b: 0.1 },
    };
  }

  let closestBlock = activeBlocks[0];
  let minDistance = Infinity;

  for (const block of activeBlocks) {
    const centerX = block.pdfBounds.x + block.pdfBounds.width / 2;
    const centerY = block.pdfBounds.y + block.pdfBounds.height / 2;
    const dist = Math.hypot(clickPdfX - centerX, clickPdfY - centerY);

    if (dist < minDistance) {
      minDistance = dist;
      closestBlock = block;
    }
  }

  return {
    fontFamily: closestBlock.fontFamily,
    fontCategory: closestBlock.fontCategory,
    fontSize: closestBlock.fontSize,
    color: { ...closestBlock.color },
  };
}


