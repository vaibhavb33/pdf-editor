import { TextBlock, PageTextData, FontChoice, OriginalLine } from "./edit-types";
import { resolveFontDisplayInfo } from "./font-matcher";

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

/**
 * Extracts and groups text items into paragraphs and single-line elements.
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

  const rawItems: Array<{
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
  }> = [];

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

    const style = styles[item.fontName] || {};
    const { fontFamily, fontCategory, isBold, isItalic } = parseFontDetails(
      item.fontName || "",
      style.fontFamily
    );

    // Indic script check from character codes
    let detectedCategory = fontCategory;
    let detectedFamily = fontFamily;
    if (/[\u0900-\u097F]/.test(item.str)) {
      detectedCategory = "devanagari";
      detectedFamily = "Noto Sans Devanagari";
    } else if (/[\u0A80-\u0AFF]/.test(item.str)) {
      detectedCategory = "gujarati";
      detectedFamily = "Noto Sans Gujarati";
    }

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
      rawFontName: item.fontName || "",
      isBold,
      isItalic,
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

  // Step 1: Merge raw items on the same baseline into continuous lines
  interface SingleLineGroup {
    str: string;
    tx: number;
    ty: number;
    endX: number;
    fontSize: number;
    fontFamily: string;
    fontCategory: FontChoice;
    rawFontName: string;
    isBold: boolean;
    isItalic: boolean;
  }

  const mergedLines: SingleLineGroup[] = [];

  for (const item of rawItems) {
    const last = mergedLines[mergedLines.length - 1];

    if (
      last &&
      Math.abs(item.ty - last.ty) < Math.max(2, item.fontSize * 0.25) &&
      Math.abs(item.fontSize - last.fontSize) < 2.5 &&
      item.fontCategory === last.fontCategory &&
      item.isBold === last.isBold &&
      item.isItalic === last.isItalic &&
      item.tx >= last.tx - 2 &&
      item.tx <= last.endX + Math.max(item.fontSize * 1.6, 14)
    ) {
      // Check if space needed between items
      const needsSpace =
        item.tx > last.endX + item.fontSize * 0.15 &&
        !last.str.endsWith(" ") &&
        !item.str.startsWith(" ");

      last.str += (needsSpace ? " " : "") + item.str;
      last.endX = Math.max(last.endX, item.tx + item.width);
    } else {
      mergedLines.push({
        str: item.str,
        tx: item.tx,
        ty: item.ty,
        endX: item.tx + item.width,
        fontSize: item.fontSize,
        fontFamily: item.fontFamily,
        fontCategory: item.fontCategory,
        rawFontName: item.rawFontName,
        isBold: item.isBold,
        isItalic: item.isItalic,
      });
    }
  }

  // Step 2: Group consecutive lines into multi-line paragraphs (Word-like text wrapping)
  interface ParagraphGroup {
    lines: SingleLineGroup[];
    fontFamily: string;
    fontCategory: FontChoice;
    rawFontName: string;
    fontSize: number;
    isBold: boolean;
    isItalic: boolean;
    isSingleLine: boolean;
  }

  const paragraphGroups: ParagraphGroup[] = [];

  for (const line of mergedLines) {
    const lastPara = paragraphGroups[paragraphGroups.length - 1];
    const prevLine = lastPara ? lastPara.lines[lastPara.lines.length - 1] : null;

    let canGroup = false;

    if (prevLine) {
      const deltaY = prevLine.ty - line.ty;
      const avgFontSize = (prevLine.fontSize + line.fontSize) / 2;

      // Vertical line-spacing condition: deltaY between 0.85x and 1.8x font size
      const isNormalLineSpacing = deltaY >= avgFontSize * 0.85 && deltaY <= avgFontSize * 2.1;

      // Same font style and similar size
      const isSameStyle =
        prevLine.fontCategory === line.fontCategory &&
        prevLine.isBold === line.isBold &&
        prevLine.isItalic === line.isItalic &&
        Math.abs(prevLine.fontSize - line.fontSize) < 1.5;

      // Horizontal alignment: lines start within reasonable margin or indented
      const isAlignedLeft = Math.abs(prevLine.tx - line.tx) < Math.max(30, avgFontSize * 3);

      // Avoid merging if previous line is a short title (< 25 chars) and ends well before line 2
      const isHeading =
        prevLine.str.length < 25 &&
        prevLine.endX < line.endX - 80 &&
        deltaY > avgFontSize * 1.4;

      canGroup = isNormalLineSpacing && isSameStyle && isAlignedLeft && !isHeading;
    }

    if (canGroup && lastPara) {
      lastPara.lines.push(line);
      lastPara.isSingleLine = false;
    } else {
      paragraphGroups.push({
        lines: [line],
        fontFamily: line.fontFamily,
        fontCategory: line.fontCategory,
        rawFontName: line.rawFontName,
        fontSize: line.fontSize,
        isBold: line.isBold,
        isItalic: line.isItalic,
        isSingleLine: true,
      });
    }
  }

  // Step 3: Create TextBlock instances with viewport coordinates
  const blocks: TextBlock[] = paragraphGroups.map((p, idx) => {
    // Union bounds across all constituent lines
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const originalLines: OriginalLine[] = [];
    const textPieces: string[] = [];

    for (const l of p.lines) {
      const lWidth = Math.max(l.endX - l.tx, l.fontSize * 0.45 * l.str.length);
      const lHeight = l.fontSize * 1.25;
      const lY = l.ty - l.fontSize * 0.25;

      minX = Math.min(minX, l.tx);
      maxX = Math.max(maxX, l.tx + lWidth);
      minY = Math.min(minY, lY);
      maxY = Math.max(maxY, lY + lHeight);

      originalLines.push({
        text: l.str,
        x: l.tx,
        y: lY,
        width: lWidth,
        height: lHeight,
      });

      textPieces.push(l.str);
    }

    const fullOriginalText = textPieces.join(p.isSingleLine ? " " : "\n");
    const blockWidth = Math.max(maxX - minX, p.fontSize * 0.5 * fullOriginalText.length);
    const blockHeight = Math.max(maxY - minY, p.fontSize * 1.25);

    const pdfBounds = {
      x: minX,
      y: minY,
      width: blockWidth,
      height: blockHeight,
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

    const fontInfo = resolveFontDisplayInfo(p.rawFontName, p.fontFamily, p.fontCategory);

    return {
      id: `block_p${pageIndex}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      pageIndex,
      originalText: fullOriginalText,
      currentText: fullOriginalText,
      x: p.lines[0].tx,
      y: p.lines[0].ty,
      pdfBounds,
      originalLines,
      viewportBounds: {
        left: vLeft,
        top: vTop,
        width: vWidth,
        height: vHeight,
      },
      fontSize: p.fontSize,
      fontFamily: p.fontFamily,
      fontCategory: p.fontCategory,
      fontName: p.rawFontName,
      isSubstitutedFont: fontInfo.isSubstitute,
      substitutedFontName: fontInfo.substitutedFontName,
      isBold: p.isBold,
      isItalic: p.isItalic,
      isUnderline: false,
      textAlign: "left",
      isSingleLine: p.isSingleLine,
      lineHeight: 1.25,
      color: { r: 0.1, g: 0.1, b: 0.1 }, // Refined by canvas sampling
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

      // Color distance from background
      const dist = Math.hypot(r - bgR255, g - bgG255, b - bgB255);
      if (dist > 40) {
        // Pixel is glyph / foreground
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

