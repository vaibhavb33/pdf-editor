import { FontChoice } from "./edit-types";

export interface NormalizedFontInfo {
  family: string;
  weight: number; // 100 - 900
  isBold: boolean;
  isItalic: boolean;
  isMonospace: boolean;
  isSerif: boolean;
}

export interface FontMappingResult {
  detectedFamily: string; // e.g. "Calibri"
  mappedFamily: string; // e.g. "Carlito"
  fontCategory: FontChoice;
  isExact: boolean;
  confidence: number; // 0.0 - 1.0
  fallbackFontFamily: string;
}

/**
 * Strips 6-letter PDF subset prefix like "ABCDEF+Arial" -> "Arial".
 */
export function stripSubsetPrefix(name: string): string {
  if (!name) return "";
  return name.replace(/^[A-Z]{6}\+/, "").trim();
}

/**
 * Normalizes raw font names by removing PostScript artifacts and parsing family/weight/style.
 * Handles patterns like "Arial-BoldMT", "TimesNewRomanPS-BoldItalicMT", "Calibri-Light",
 * "Poppins-SemiBold", "CMR10", "LiberationSans", "Carlito-Regular", etc.
 */
export function normalizePdfFontName(rawName: string): NormalizedFontInfo {
  const stripped = stripSubsetPrefix(rawName);
  // Replace underscores and commas with hyphens
  let clean = stripped.replace(/[,_]/g, "-");

  // Remove common PostScript suffixes that obscure the real family name
  clean = clean
    .replace(/(PSMT|PS-MT|PS|MT|MS)$/i, "")
    .replace(/-Regular$/i, "")
    .replace(/-Roman$/i, "");

  const lower = clean.toLowerCase();

  // Detect Bold / Weights
  let weight = 400;
  let isBold = false;
  if (lower.includes("black") || lower.includes("heavy") || lower.includes("ultra-bold") || lower.includes("900")) {
    weight = 900;
    isBold = true;
  } else if (lower.includes("extra-bold") || lower.includes("extrabold") || lower.includes("800")) {
    weight = 800;
    isBold = true;
  } else if (lower.includes("bold") || lower.includes("700")) {
    weight = 700;
    isBold = true;
  } else if (lower.includes("semibold") || lower.includes("semi-bold") || lower.includes("demi") || lower.includes("600")) {
    weight = 600;
    isBold = true;
  } else if (lower.includes("medium") || lower.includes("500")) {
    weight = 500;
  } else if (lower.includes("light") || lower.includes("300")) {
    weight = 300;
  } else if (lower.includes("extralight") || lower.includes("extra-light") || lower.includes("thin") || lower.includes("100") || lower.includes("200")) {
    weight = 200;
  }

  // Detect Italic / Oblique
  let isItalic =
    lower.includes("italic") ||
    lower.includes("oblique") ||
    lower.includes("slanted") ||
    lower.includes("kursiv") ||
    lower.includes("-it") ||
    lower.endsWith("it");

  // Strip weight and style tokens from family name
  let family = clean
    .replace(/-(bold|italic|oblique|regular|black|heavy|semibold|demibold|medium|light|thin|extrabold|extralight).*/gi, "")
    .replace(/(bold|italic|oblique|regular|black|heavy|semibold|demibold|medium|light|thin|extrabold|extralight)/gi, "")
    .replace(/-+/g, " ")
    .trim();

  // Handle CamelCase splitting for names like "TimesNewRoman" -> "Times New Roman"
  if (/^[A-Z][a-z]+[A-Z]/.test(family) && !family.includes(" ")) {
    family = family.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  // TeX Computer Modern special cases: "CMR10", "CMBX12", "CMSY", "CMTI"
  if (/^CM[A-Z0-9]+$/i.test(stripped)) {
    family = "Computer Modern Roman";
    if (lower.includes("bx") || lower.includes("b")) isBold = true;
    if (lower.includes("ti") || lower.includes("sl")) isItalic = true;
  }

  // Latin Modern
  if (/^LM[A-Z0-9]+$/i.test(stripped)) {
    family = "Latin Modern Roman";
    if (lower.includes("bold") || lower.includes("b")) isBold = true;
    if (lower.includes("italic") || lower.includes("ri") || lower.includes("ro")) isItalic = true;
  }

  const isMonospace =
    lower.includes("mono") ||
    lower.includes("courier") ||
    lower.includes("consolas") ||
    lower.includes("menlo") ||
    lower.includes("typewriter") ||
    lower.includes("cmtt") ||
    lower.includes("code");

  const isSerif =
    !isMonospace &&
    (lower.includes("times") ||
      lower.includes("serif") ||
      lower.includes("georgia") ||
      lower.includes("garamond") ||
      lower.includes("cambria") ||
      lower.includes("palatino") ||
      lower.includes("baskerville") ||
      lower.includes("minion") ||
      lower.includes("merriweather") ||
      lower.includes("lora") ||
      lower.includes("tinos") ||
      lower.includes("caladea") ||
      lower.includes("cormorant") ||
      lower.includes("playfair") ||
      lower.includes("cmr"));

  return {
    family: family || (isSerif ? "Times New Roman" : isMonospace ? "Courier New" : "Arial"),
    weight,
    isBold,
    isItalic,
    isMonospace,
    isSerif,
  };
}

/**
 * Standard Mapping Table from normalized font family to bundled font, category, and display info.
 */
export const FONT_MAPPING_CATALOG: Array<{
  matchPatterns: RegExp[];
  detectedFamily: string;
  mappedFamily: string;
  fontCategory: FontChoice;
  isExact: boolean;
  confidence: number;
  fallbackFontFamily: string;
}> = [
  // 1. Calibri -> Carlito (Metric compatible)
  {
    matchPatterns: [/calibri/i, /carlito/i],
    detectedFamily: "Calibri",
    mappedFamily: "Carlito",
    fontCategory: "calibri",
    isExact: false,
    confidence: 0.95,
    fallbackFontFamily: "Carlito, Calibri, sans-serif",
  },
  // 2. Cambria -> Caladea (Metric compatible)
  {
    matchPatterns: [/cambria/i, /caladea/i],
    detectedFamily: "Cambria",
    mappedFamily: "Caladea",
    fontCategory: "cambria",
    isExact: false,
    confidence: 0.95,
    fallbackFontFamily: "Caladea, Cambria, serif",
  },
  // 3. Times / Times New Roman -> Tinos / Liberation Serif
  {
    matchPatterns: [/times\s*new\s*roman/i, /^times/i, /tinos/i, /liberation\s*serif/i],
    detectedFamily: "Times New Roman",
    mappedFamily: "Liberation Serif",
    fontCategory: "serif",
    isExact: false,
    confidence: 0.95,
    fallbackFontFamily: "'Liberation Serif', 'Times New Roman', Times, serif",
  },
  // 4. Arial / Helvetica -> Arimo / Liberation Sans
  {
    matchPatterns: [/arial/i, /helvetica/i, /arimo/i, /liberation\s*sans/i],
    detectedFamily: "Arial",
    mappedFamily: "Liberation Sans",
    fontCategory: "sans-serif",
    isExact: false,
    confidence: 0.95,
    fallbackFontFamily: "'Liberation Sans', Arial, Helvetica, sans-serif",
  },
  // 5. Courier / Courier New -> Cousine / Liberation Mono
  {
    matchPatterns: [/courier/i, /cousine/i, /liberation\s*mono/i, /consolas/i, /menlo/i],
    detectedFamily: "Courier New",
    mappedFamily: "Liberation Mono",
    fontCategory: "monospace",
    isExact: false,
    confidence: 0.95,
    fallbackFontFamily: "'Liberation Mono', 'Courier New', Courier, monospace",
  },
  // 6. Georgia -> Gelasio
  {
    matchPatterns: [/georgia/i, /gelasio/i],
    detectedFamily: "Georgia",
    mappedFamily: "Gelasio",
    fontCategory: "serif",
    isExact: false,
    confidence: 0.9,
    fallbackFontFamily: "Gelasio, Georgia, serif",
  },
  // 7. Garamond -> EB Garamond
  {
    matchPatterns: [/garamond/i, /eb\s*garamond/i],
    detectedFamily: "EB Garamond",
    mappedFamily: "EB Garamond",
    fontCategory: "serif",
    isExact: true,
    confidence: 0.9,
    fallbackFontFamily: "'EB Garamond', Garamond, serif",
  },
  // 8. Palatino / Book Antiqua
  {
    matchPatterns: [/palatino/i, /book\s*antiqua/i],
    detectedFamily: "Palatino",
    mappedFamily: "Liberation Serif",
    fontCategory: "serif",
    isExact: false,
    confidence: 0.85,
    fallbackFontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
  },
  // 9. Verdana / Tahoma -> DejaVu Sans
  {
    matchPatterns: [/verdana/i, /tahoma/i, /dejavu\s*sans/i],
    detectedFamily: "Verdana",
    mappedFamily: "DejaVu Sans",
    fontCategory: "sans-serif",
    isExact: false,
    confidence: 0.9,
    fallbackFontFamily: "Verdana, 'DejaVu Sans', sans-serif",
  },
  // 10. Segoe UI -> Open Sans
  {
    matchPatterns: [/segoe/i],
    detectedFamily: "Segoe UI",
    mappedFamily: "Open Sans",
    fontCategory: "sans-serif",
    isExact: false,
    confidence: 0.85,
    fallbackFontFamily: "'Segoe UI', 'Open Sans', sans-serif",
  },
  // 11. Computer Modern (TeX)
  {
    matchPatterns: [/computer\s*modern/i, /latin\s*modern/i, /^cm[a-z0-9]+/i, /^lm[a-z0-9]+/i],
    detectedFamily: "Latin Modern Roman",
    mappedFamily: "Latin Modern Roman",
    fontCategory: "serif",
    isExact: true,
    confidence: 0.95,
    fallbackFontFamily: "'Latin Modern Roman', 'Computer Modern Roman', serif",
  },
  // 12. Roboto
  {
    matchPatterns: [/roboto(?!\s*mono)/i],
    detectedFamily: "Roboto",
    mappedFamily: "Roboto",
    fontCategory: "roboto",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "Roboto, sans-serif",
  },
  // 13. Roboto Mono
  {
    matchPatterns: [/roboto\s*mono/i],
    detectedFamily: "Roboto Mono",
    mappedFamily: "Roboto Mono",
    fontCategory: "monospace",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "'Roboto Mono', monospace",
  },
  // 14. Inter
  {
    matchPatterns: [/^inter/i],
    detectedFamily: "Inter",
    mappedFamily: "Inter",
    fontCategory: "sans-serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "Inter, sans-serif",
  },
  // 15. Open Sans
  {
    matchPatterns: [/open\s*sans/i],
    detectedFamily: "Open Sans",
    mappedFamily: "Open Sans",
    fontCategory: "sans-serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "'Open Sans', sans-serif",
  },
  // 16. Poppins
  {
    matchPatterns: [/poppins/i],
    detectedFamily: "Poppins",
    mappedFamily: "Poppins",
    fontCategory: "sans-serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "Poppins, sans-serif",
  },
  // 17. Montserrat
  {
    matchPatterns: [/montserrat/i],
    detectedFamily: "Montserrat",
    mappedFamily: "Montserrat",
    fontCategory: "sans-serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "Montserrat, sans-serif",
  },
  // 18. Lato
  {
    matchPatterns: [/lato/i],
    detectedFamily: "Lato",
    mappedFamily: "Lato",
    fontCategory: "sans-serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "Lato, sans-serif",
  },
  // 19. Merriweather
  {
    matchPatterns: [/merriweather/i],
    detectedFamily: "Merriweather",
    mappedFamily: "Merriweather",
    fontCategory: "serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "Merriweather, serif",
  },
  // 20. Playfair Display
  {
    matchPatterns: [/playfair/i],
    detectedFamily: "Playfair Display",
    mappedFamily: "Playfair Display",
    fontCategory: "serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "'Playfair Display', serif",
  },
  // 21. Source Sans 3 / Source Sans Pro
  {
    matchPatterns: [/source\s*sans/i],
    detectedFamily: "Source Sans 3",
    mappedFamily: "Source Sans 3",
    fontCategory: "sans-serif",
    isExact: true,
    confidence: 1.0,
    fallbackFontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif",
  },
  // 22. Indian Languages: Devanagari / Hindi
  {
    matchPatterns: [/devanagari/i, /hindi/i, /mangal/i, /aparajita/i, /kokila/i, /utsah/i],
    detectedFamily: "Noto Sans Devanagari",
    mappedFamily: "Noto Sans Devanagari",
    fontCategory: "devanagari",
    isExact: true,
    confidence: 0.95,
    fallbackFontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  // 23. Indian Languages: Gujarati
  {
    matchPatterns: [/gujarati/i, /shruti/i],
    detectedFamily: "Noto Sans Gujarati",
    mappedFamily: "Noto Sans Gujarati",
    fontCategory: "gujarati",
    isExact: true,
    confidence: 0.95,
    fallbackFontFamily: "'Noto Sans Gujarati', sans-serif",
  },
  // 24. Handwriting / Script: Dancing Script / Caveat / Great Vibes
  {
    matchPatterns: [/dancing\s*script/i, /caveat/i, /great\s*vibes/i, /brush\s*script/i, /script/i, /cursive/i],
    detectedFamily: "Dancing Script",
    mappedFamily: "Dancing Script",
    fontCategory: "sans-serif",
    isExact: true,
    confidence: 0.9,
    fallbackFontFamily: "'Dancing Script', Caveat, cursive",
  },
];

/**
 * Resolves a normalized font name and category against the catalog.
 * Uses flags and character metrics when the name is unknown.
 * NEVER defaults to Times New Roman unless verified to be a serif!
 */
export function matchFontInCatalog(
  rawName: string,
  styleFamily?: string,
  flags?: { isSerif?: boolean; isMonospace?: boolean; isBold?: boolean; isItalic?: boolean }
): FontMappingResult {
  const norm = normalizePdfFontName(rawName);
  const searchString = `${norm.family} ${rawName} ${styleFamily || ""}`.toLowerCase();

  for (const entry of FONT_MAPPING_CATALOG) {
    for (const pat of entry.matchPatterns) {
      if (pat.test(searchString)) {
        const detected =
          norm.family && (norm.family.toLowerCase().includes("liberation") || norm.family.toLowerCase().includes("arimo") || norm.family.toLowerCase().includes("tinos"))
            ? norm.family
            : entry.detectedFamily;

        const isExactMatch =
          entry.isExact ||
          detected.toLowerCase().replace(/[\s-_]/g, "") === entry.mappedFamily.toLowerCase().replace(/[\s-_]/g, "");

        return {
          detectedFamily: detected,
          mappedFamily: entry.mappedFamily,
          fontCategory: entry.fontCategory,
          isExact: isExactMatch,
          confidence: isExactMatch ? 1.0 : entry.confidence,
          fallbackFontFamily: entry.fallbackFontFamily,
        };
      }
    }
  }

  // Fallback using flags and metrics - NEVER default to Times New Roman unless serif!
  const isMono = flags?.isMonospace || norm.isMonospace;
  if (isMono) {
    return {
      detectedFamily: norm.family || "Monospace",
      mappedFamily: "Liberation Mono",
      fontCategory: "monospace",
      isExact: false,
      confidence: 0.7,
      fallbackFontFamily: "'Liberation Mono', 'Courier New', Courier, monospace",
    };
  }

  const isSerif = flags?.isSerif || norm.isSerif;
  if (isSerif) {
    return {
      detectedFamily: norm.family || "Times New Roman",
      mappedFamily: "Liberation Serif",
      fontCategory: "serif",
      isExact: false,
      confidence: 0.7,
      fallbackFontFamily: "'Liberation Serif', 'Times New Roman', Times, serif",
    };
  }

  // Default for sans-serif / unknown: Arial / Liberation Sans
  return {
    detectedFamily: norm.family || "Arial",
    mappedFamily: "Liberation Sans",
    fontCategory: "sans-serif",
    isExact: false,
    confidence: 0.7,
    fallbackFontFamily: "'Liberation Sans', Arial, Helvetica, sans-serif",
  };
}
