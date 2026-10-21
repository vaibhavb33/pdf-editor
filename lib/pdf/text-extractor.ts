import { TextBlock, PageTextData } from "./edit-types";

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
 * Extracts and merges text items from a PDF.js page.
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
    fontSize: number;
    fontFamily: string;
    rawFontName: string;
    isBold: boolean;
    isItalic: boolean;
  }> = [];

  for (const raw of textContent.items) {
    if (!raw || typeof raw.str !== "string" || raw.str.trim() === "") {
      continue;
    }
    const item = raw as RawTextItem;
    const transform = item.transform;
    const tx = transform[4];
    const ty = transform[5];

    // Compute font size in PDF points
    const fontSize = Math.max(
      6,
      Math.round(Math.hypot(transform[0], transform[1]) * 10) / 10
    );

    const style = styles[item.fontName] || {};
    const styleFontFamily = (style.fontFamily || "").toLowerCase();
    const rawFontName = (item.fontName || "").toLowerCase();
    const combinedFontStr = `${styleFontFamily} ${rawFontName}`;

    // Detect bold / italic from font names
    const isBold =
      combinedFontStr.includes("bold") ||
      combinedFontStr.includes("black") ||
      combinedFontStr.includes("heavy") ||
      combinedFontStr.includes("700") ||
      combinedFontStr.includes("800");

    const isItalic =
      combinedFontStr.includes("italic") ||
      combinedFontStr.includes("oblique") ||
      combinedFontStr.includes("slanted");

    // Detect font family category
    let fontFamily = "sans-serif";
    if (
      combinedFontStr.includes("times") ||
      combinedFontStr.includes("serif") ||
      combinedFontStr.includes("roman") ||
      combinedFontStr.includes("georgia") ||
      combinedFontStr.includes("cambria") ||
      combinedFontStr.includes("garamond")
    ) {
      fontFamily = "serif";
    } else if (
      combinedFontStr.includes("courier") ||
      combinedFontStr.includes("mono") ||
      combinedFontStr.includes("consolas") ||
      combinedFontStr.includes("menlo")
    ) {
      fontFamily = "monospace";
    }

    rawItems.push({
      str: item.str,
      tx,
      ty,
      width: Math.max(item.width, fontSize * 0.5 * item.str.length),
      fontSize,
      fontFamily,
      rawFontName: item.fontName || "",
      isBold,
      isItalic,
    });
  }

  // Sort raw items: top-to-bottom (ty descending), then left-to-right (tx ascending)
  rawItems.sort((a, b) => {
    const yDiff = b.ty - a.ty;
    if (Math.abs(yDiff) > Math.min(a.fontSize, b.fontSize) * 0.4) {
      return yDiff;
    }
    return a.tx - b.tx;
  });

  // Merge items on the same baseline into coherent editable blocks
  interface MergeGroup {
    str: string;
    tx: number;
    ty: number;
    endX: number;
    fontSize: number;
    fontFamily: string;
    rawFontName: string;
    isBold: boolean;
    isItalic: boolean;
  }

  const mergedGroups: MergeGroup[] = [];

  for (const item of rawItems) {
    const last = mergedGroups[mergedGroups.length - 1];

    if (
      last &&
      Math.abs(item.ty - last.ty) < Math.max(2, item.fontSize * 0.25) &&
      Math.abs(item.fontSize - last.fontSize) < 2.5 &&
      item.fontFamily === last.fontFamily &&
      item.isBold === last.isBold &&
      item.isItalic === last.isItalic &&
      item.tx >= last.tx - 2 &&
      item.tx <= last.endX + Math.max(item.fontSize * 1.5, 12)
    ) {
      // Check if space needed between items
      const needsSpace =
        item.tx > last.endX + item.fontSize * 0.15 &&
        !last.str.endsWith(" ") &&
        !item.str.startsWith(" ");

      last.str += (needsSpace ? " " : "") + item.str;
      last.endX = Math.max(last.endX, item.tx + item.width);
    } else {
      mergedGroups.push({
        str: item.str,
        tx: item.tx,
        ty: item.ty,
        endX: item.tx + item.width,
        fontSize: item.fontSize,
        fontFamily: item.fontFamily,
        rawFontName: item.rawFontName,
        isBold: item.isBold,
        isItalic: item.isItalic,
      });
    }
  }

  // Convert merged groups to TextBlocks with accurate PDF points & viewport bounds
  const blocks: TextBlock[] = mergedGroups.map((g, idx) => {
    const pdfWidth = Math.max(g.endX - g.tx, g.fontSize * 0.5 * g.str.length);
    // PDF baseline box: descenders reach ~0.25 * fontSize down, ascenders ~0.95 * fontSize up
    const pdfBounds = {
      x: g.tx,
      y: g.ty - g.fontSize * 0.25,
      width: pdfWidth,
      height: g.fontSize * 1.25,
    };

    // Calculate viewport CSS pixels using PDF.js viewport conversion
    const [left, bottom] = viewport.convertToViewportPoint(pdfBounds.x, pdfBounds.y);
    const [right, top] = viewport.convertToViewportPoint(
      pdfBounds.x + pdfBounds.width,
      pdfBounds.y + pdfBounds.height
    );

    const vLeft = Math.round(Math.min(left, right));
    const vTop = Math.round(Math.min(top, bottom));
    const vWidth = Math.max(20, Math.round(Math.abs(right - left)));
    const vHeight = Math.max(14, Math.round(Math.abs(bottom - top)));

    return {
      id: `block_p${pageIndex}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      pageIndex,
      originalText: g.str,
      currentText: g.str,
      x: g.tx,
      y: g.ty,
      pdfBounds,
      viewportBounds: {
        left: vLeft,
        top: vTop,
        width: vWidth,
        height: vHeight,
      },
      fontSize: g.fontSize,
      fontFamily: g.fontFamily,
      fontName: g.rawFontName,
      isBold: g.isBold,
      isItalic: g.isItalic,
      color: { r: 0.1, g: 0.1, b: 0.1 }, // Default dark neutral
      bgColor: { r: 1, g: 1, b: 1 }, // Default white, refined by canvas sampling
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
 * Samples pixels from the edges of the bounding box to avoid sampling the text itself.
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
    // Sample corner pixels which are most likely background rather than glyphs
    const cornerOffsets = [
      0, // top-left
      (Math.min(sw, 40) - 1) * 4, // top-right
      ((Math.min(sh, 40) - 1) * Math.min(sw, 40)) * 4, // bottom-left
      ((Math.min(sh, 40) - 1) * Math.min(sw, 40) + Math.min(sw, 40) - 1) * 4, // bottom-right
    ];

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    for (const offset of cornerOffsets) {
      if (offset >= 0 && offset + 2 < imgData.length) {
        // If alpha is high enough
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
    // If canvas is tainted or security error, fallback to clean white
  }

  return { r: 1, g: 1, b: 1 };
}
