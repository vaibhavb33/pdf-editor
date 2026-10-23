import { PDFDocument, PDFFont, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { FontChoice } from "./edit-types";

export interface FontMatchOptions {
  fontFamily: string; // e.g. "Calibri", "Arial", "Times New Roman", etc.
  fontCategory?: FontChoice;
  isBold?: boolean;
  isItalic?: boolean;
  textToEncode?: string;
}

export interface FontRun {
  font: PDFFont;
  text: string;
}

// In-memory cache for TTF font ArrayBuffers
const ttfBufferCache = new Map<string, ArrayBuffer>();
const embeddedFontCache = new WeakMap<PDFDocument, Map<string, PDFFont>>();

export async function loadLocalFontBuffer(fontFileName: string): Promise<ArrayBuffer | null> {
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
    console.warn(`Could not load local font file: ${fontFileName}`, err);
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
 * Checks if a given PDFFont can encode a single character without throwing.
 */
export function canFontEncodeChar(font: PDFFont, char: string): boolean {
  try {
    font.encodeText(char);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to get or embed a TTF font in the document with caching.
 */
async function getOrEmbedTtf(
  pdfDoc: PDFDocument,
  ttfFileName: string
): Promise<PDFFont | null> {
  let docCache = embeddedFontCache.get(pdfDoc);
  if (!docCache) {
    docCache = new Map<string, PDFFont>();
    embeddedFontCache.set(pdfDoc, docCache);
  }

  if (docCache.has(ttfFileName)) {
    return docCache.get(ttfFileName)!;
  }

  try {
    pdfDoc.registerFontkit(fontkit);
    const bytes = await loadLocalFontBuffer(ttfFileName);
    if (!bytes) return null;
    const font = await pdfDoc.embedFont(bytes, { subset: true });
    docCache.set(ttfFileName, font);
    return font;
  } catch (err) {
    console.warn(`Failed to embed TTF font ${ttfFileName}:`, err);
    return null;
  }
}

/**
 * Resolves font display information and whether it was substituted.
 */
export function resolveFontDisplayInfo(
  fontName: string | undefined,
  fontFamily: string | undefined,
  category: FontChoice | undefined
): { displayName: string; substitutedFontName: string; isSubstitute: boolean } {
  const raw = ((fontName || "") + " " + (fontFamily || "")).toLowerCase();

  if (raw.includes("calibri") || category === "calibri") {
    return {
      displayName: "Calibri",
      substitutedFontName: "Carlito (Calibri metric-compatible)",
      isSubstitute: true,
    };
  }
  if (raw.includes("cambria") || category === "cambria") {
    return {
      displayName: "Cambria",
      substitutedFontName: "Caladea (Cambria metric-compatible)",
      isSubstitute: true,
    };
  }
  if (raw.includes("times") || raw.includes("roman") || category === "serif") {
    return {
      displayName: "Times New Roman",
      substitutedFontName: "Liberation Serif (Times-compatible)",
      isSubstitute: true,
    };
  }
  if (raw.includes("courier") || raw.includes("mono") || category === "monospace") {
    return {
      displayName: "Courier New",
      substitutedFontName: "Liberation Mono (Courier-compatible)",
      isSubstitute: true,
    };
  }
  if (raw.includes("devanagari") || raw.includes("hindi") || category === "devanagari") {
    return {
      displayName: "Devanagari / Hindi",
      substitutedFontName: "Noto Sans Devanagari",
      isSubstitute: true,
    };
  }
  if (raw.includes("gujarati") || category === "gujarati") {
    return {
      displayName: "Gujarati",
      substitutedFontName: "Noto Sans Gujarati",
      isSubstitute: true,
    };
  }
  if (raw.includes("roboto") || category === "roboto") {
    return {
      displayName: "Roboto",
      substitutedFontName: "Roboto",
      isSubstitute: false,
    };
  }

  return {
    displayName: fontFamily || "Arial",
    substitutedFontName: "Liberation Sans (Arial/Helvetica-compatible)",
    isSubstitute: true,
  };
}

/**
 * Resolves the primary matching font for a given text block.
 */
export async function getBestMatchingFont(
  pdfDoc: PDFDocument,
  options: FontMatchOptions
): Promise<PDFFont> {
  const { fontFamily, fontCategory, isBold = false, isItalic = false, textToEncode = "" } = options;
  const fam = (fontFamily || "").toLowerCase();

  // 1. Script-specific fonts
  const hasDevanagari = /[\u0900-\u097F]/.test(textToEncode) || fam.includes("deva") || fam.includes("hindi") || fontCategory === "devanagari";
  if (hasDevanagari) {
    const file = isBold ? "noto-devanagari-bold.ttf" : "noto-devanagari.ttf";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  const hasGujarati = /[\u0A80-\u0AFF]/.test(textToEncode) || fam.includes("guj") || fontCategory === "gujarati";
  if (hasGujarati) {
    const file = isBold ? "noto-gujarati-bold.ttf" : "noto-gujarati.ttf";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  const hasTamil = /[\u0B80-\u0BFF]/.test(textToEncode) || fam.includes("tamil");
  if (hasTamil) {
    const font = await getOrEmbedTtf(pdfDoc, "noto-tamil.woff");
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  const hasBengali = /[\u0980-\u09FF]/.test(textToEncode) || fam.includes("bengali");
  if (hasBengali) {
    const font = await getOrEmbedTtf(pdfDoc, "noto-bengali.woff");
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  // 2. Specific bundled families
  if (fam.includes("inter")) {
    const file = isBold ? "inter-bold.woff" : "inter.woff";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("poppins")) {
    const file = isBold ? "poppins-bold.woff" : "poppins.woff";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("open sans")) {
    const file = isBold ? "open-sans-bold.woff" : "open-sans.woff";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("lato")) {
    const file = isBold ? "lato-bold.woff" : "lato.woff";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("playfair")) {
    const file = isBold ? "playfair-display-bold.woff" : "playfair-display.woff";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("merriweather")) {
    const file = isBold ? "merriweather-bold.woff" : "merriweather.woff";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("garamond")) {
    const font = await getOrEmbedTtf(pdfDoc, "eb-garamond.woff");
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("dancing script")) {
    const file = isBold ? "dancing-script-bold.woff" : "dancing-script.woff";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("caveat")) {
    const font = await getOrEmbedTtf(pdfDoc, "caveat.woff");
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("great vibes")) {
    const font = await getOrEmbedTtf(pdfDoc, "great-vibes.woff");
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("roboto mono")) {
    const font = await getOrEmbedTtf(pdfDoc, "roboto-mono.woff");
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  if (fam.includes("roboto") || fontCategory === "roboto") {
    const file = isBold ? "roboto-bold.ttf" : "roboto.ttf";
    const font = await getOrEmbedTtf(pdfDoc, file);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  // 3. Metric-compatible fonts
  // Calibri -> Carlito
  if (fam.includes("calibri") || fam.includes("carlito") || fontCategory === "calibri") {
    const ttf = isBold ? "carlito-bold.ttf" : "carlito.ttf";
    const font = await getOrEmbedTtf(pdfDoc, ttf);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  // Cambria -> Caladea
  if (fam.includes("cambria") || fam.includes("caladea") || fontCategory === "cambria") {
    const ttf = isBold ? "caladea-bold.ttf" : "caladea.ttf";
    const font = await getOrEmbedTtf(pdfDoc, ttf);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  // Serif (Times New Roman / Liberation Serif / Georgia / Gelasio)
  if (fam.includes("serif") || fam.includes("times") || fam.includes("roman") || fam.includes("georgia") || fontCategory === "serif") {
    const ttf = isBold ? "serif-bold.ttf" : "serif.ttf";
    const font = await getOrEmbedTtf(pdfDoc, ttf);
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  // Monospace (Courier New / Liberation Mono / Consolas)
  if (fam.includes("mono") || fam.includes("courier") || fam.includes("consolas") || fontCategory === "monospace") {
    const font = await getOrEmbedTtf(pdfDoc, "mono.ttf");
    if (font && canFontEncodeText(font, textToEncode)) return font;
  }

  // Default Sans-Serif (Arial / Liberation Sans / Verdana)
  const sansTtf = isBold ? "sans-bold.ttf" : isItalic ? "sans-italic.ttf" : "sans.ttf";
  const sansFont = await getOrEmbedTtf(pdfDoc, sansTtf);
  if (sansFont && canFontEncodeText(sansFont, textToEncode)) {
    return sansFont;
  }

  // 4. Fallback to standard PDF fonts
  let stdName: StandardFonts;
  if (fam.includes("serif") || fam.includes("times") || fontCategory === "serif") {
    if (isBold && isItalic) stdName = StandardFonts.TimesRomanBoldItalic;
    else if (isBold) stdName = StandardFonts.TimesRomanBold;
    else if (isItalic) stdName = StandardFonts.TimesRomanItalic;
    else stdName = StandardFonts.TimesRoman;
  } else if (fam.includes("mono") || fam.includes("courier") || fontCategory === "monospace") {
    if (isBold && isItalic) stdName = StandardFonts.CourierBoldOblique;
    else if (isBold) stdName = StandardFonts.CourierBold;
    else if (isItalic) stdName = StandardFonts.CourierOblique;
    else stdName = StandardFonts.Courier;
  } else {
    if (isBold && isItalic) stdName = StandardFonts.HelveticaBoldOblique;
    else if (isBold) stdName = StandardFonts.HelveticaBold;
    else if (isItalic) stdName = StandardFonts.HelveticaOblique;
    else stdName = StandardFonts.Helvetica;
  }

  return await pdfDoc.embedFont(stdName);
}

/**
 * Splits a text string into runs of characters matching their encodable font.
 * Ensures per-character fallback so export never fails on mixed Latin / Indic / symbols.
 */
export async function splitTextIntoFontRuns(
  pdfDoc: PDFDocument,
  primaryFont: PDFFont,
  text: string,
  isBold = false
): Promise<FontRun[]> {
  if (!text) return [];

  // Check if primary font encodes the whole text cleanly
  if (canFontEncodeText(primaryFont, text)) {
    return [{ font: primaryFont, text }];
  }

  // Prepare fallback font candidates
  const devanagariFont = await getOrEmbedTtf(pdfDoc, isBold ? "noto-devanagari-bold.ttf" : "noto-devanagari.ttf");
  const gujaratiFont = await getOrEmbedTtf(pdfDoc, isBold ? "noto-gujarati-bold.ttf" : "noto-gujarati.ttf");
  const tamilFont = await getOrEmbedTtf(pdfDoc, "noto-tamil.woff");
  const bengaliFont = await getOrEmbedTtf(pdfDoc, "noto-bengali.woff");
  const sansFont = await getOrEmbedTtf(pdfDoc, isBold ? "sans-bold.ttf" : "sans.ttf");
  const robotoFont = await getOrEmbedTtf(pdfDoc, isBold ? "roboto-bold.ttf" : "roboto.ttf");

  const runs: FontRun[] = [];
  let currentRunText = "";
  let currentRunFont: PDFFont = primaryFont;

  for (const char of text) {
    let chosenFont: PDFFont = primaryFont;

    if (canFontEncodeChar(primaryFont, char)) {
      chosenFont = primaryFont;
    } else if (/[\u0900-\u097F]/.test(char) && devanagariFont && canFontEncodeChar(devanagariFont, char)) {
      chosenFont = devanagariFont;
    } else if (/[\u0A80-\u0AFF]/.test(char) && gujaratiFont && canFontEncodeChar(gujaratiFont, char)) {
      chosenFont = gujaratiFont;
    } else if (/[\u0B80-\u0BFF]/.test(char) && tamilFont && canFontEncodeChar(tamilFont, char)) {
      chosenFont = tamilFont;
    } else if (/[\u0980-\u09FF]/.test(char) && bengaliFont && canFontEncodeChar(bengaliFont, char)) {
      chosenFont = bengaliFont;
    } else if (sansFont && canFontEncodeChar(sansFont, char)) {
      chosenFont = sansFont;
    } else if (robotoFont && canFontEncodeChar(robotoFont, char)) {
      chosenFont = robotoFont;
    } else {
      chosenFont = primaryFont;
    }

    if (chosenFont === currentRunFont) {
      currentRunText += char;
    } else {
      if (currentRunText.length > 0) {
        runs.push({ font: currentRunFont, text: currentRunText });
      }
      currentRunText = char;
      currentRunFont = chosenFont;
    }
  }

  if (currentRunText.length > 0) {
    runs.push({ font: currentRunFont, text: currentRunText });
  }

  return runs;
}

