import { PDFDocument, PDFFont, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export interface FontMatchOptions {
  fontFamily: string; // "sans-serif" | "serif" | "monospace" | custom
  isBold?: boolean;
  isItalic?: boolean;
  textToEncode?: string;
}

// In-memory cache for TTF font ArrayBuffers
const ttfBufferCache = new Map<string, ArrayBuffer>();

async function loadLocalFontBuffer(fontFileName: string): Promise<ArrayBuffer | null> {
  if (ttfBufferCache.has(fontFileName)) {
    return ttfBufferCache.get(fontFileName)!;
  }

  try {
    if (typeof window !== "undefined") {
      const res = await fetch(`/fonts/${fontFileName}`);
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      ttfBufferCache.set(fontFileName, buffer);
      return buffer;
    } else {
      // Node.js environment fallback for automated testing
      const fs = await import("node:fs");
      const path = await import("node:path");
      const fontPath = path.resolve(process.cwd(), "public", "fonts", fontFileName);
      if (fs.existsSync(fontPath)) {
        const buffer = fs.readFileSync(fontPath).buffer;
        ttfBufferCache.set(fontFileName, buffer);
        return buffer;
      }
    }
  } catch (err) {
    console.warn(`Could not load local fallback font: ${fontFileName}`, err);
  }

  return null;
}

/**
 * Checks if a given PDFFont can encode all characters in a string without throwing.
 */
export function canFontEncodeText(font: PDFFont, text: string): boolean {
  if (!text) return true;
  try {
    font.encodeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the best matching font for a text block, prioritizing:
 * 1. Standard PDF fonts (fast, 0-byte overhead).
 * 2. Local bundled TTF fonts via fontkit if text has characters standard fonts cannot encode.
 */
export async function getBestMatchingFont(
  pdfDoc: PDFDocument,
  options: FontMatchOptions
): Promise<PDFFont> {
  const { fontFamily, isBold = false, isItalic = false, textToEncode = "" } = options;

  // 1. Pick appropriate standard PDF font
  let standardFontName: StandardFonts;

  const family = (fontFamily || "").toLowerCase();
  if (family.includes("serif") || family.includes("times") || family.includes("roman")) {
    if (isBold && isItalic) {
      standardFontName = StandardFonts.TimesRomanBoldItalic;
    } else if (isBold) {
      standardFontName = StandardFonts.TimesRomanBold;
    } else if (isItalic) {
      standardFontName = StandardFonts.TimesRomanItalic;
    } else {
      standardFontName = StandardFonts.TimesRoman;
    }
  } else if (family.includes("mono") || family.includes("courier")) {
    if (isBold && isItalic) {
      standardFontName = StandardFonts.CourierBoldOblique;
    } else if (isBold) {
      standardFontName = StandardFonts.CourierBold;
    } else if (isItalic) {
      standardFontName = StandardFonts.CourierOblique;
    } else {
      standardFontName = StandardFonts.Courier;
    }
  } else {
    // Default: Sans-Serif / Helvetica
    if (isBold && isItalic) {
      standardFontName = StandardFonts.HelveticaBoldOblique;
    } else if (isBold) {
      standardFontName = StandardFonts.HelveticaBold;
    } else if (isItalic) {
      standardFontName = StandardFonts.HelveticaOblique;
    } else {
      standardFontName = StandardFonts.Helvetica;
    }
  }

  const standardFont = await pdfDoc.embedFont(standardFontName);

  // If text is ASCII / WinAnsi compatible, standard font is optimal
  if (canFontEncodeText(standardFont, textToEncode)) {
    return standardFont;
  }

  // 2. Unicode fallback: embed local TTF font via fontkit
  try {
    pdfDoc.registerFontkit(fontkit);

    let ttfName = "sans.ttf";
    if (family.includes("serif") || family.includes("times")) {
      ttfName = isBold ? "serif-bold.ttf" : "serif.ttf";
    } else if (family.includes("mono") || family.includes("courier")) {
      ttfName = "mono.ttf";
    } else {
      if (isBold) ttfName = "sans-bold.ttf";
      else if (isItalic) ttfName = "sans-italic.ttf";
      else ttfName = "sans.ttf";
    }

    const ttfBytes = await loadLocalFontBuffer(ttfName);
    if (ttfBytes) {
      const customFont = await pdfDoc.embedFont(ttfBytes, { subset: true });
      if (canFontEncodeText(customFont, textToEncode)) {
        return customFont;
      }
    }
  } catch (err) {
    console.warn("Error embedding TTF fallback font:", err);
  }

  // Fallback to standard font if TTF failed
  return standardFont;
}
