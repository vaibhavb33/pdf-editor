export type FontChoice =
  | "sans-serif"
  | "serif"
  | "monospace"
  | "calibri"
  | "cambria"
  | "roboto"
  | "devanagari"
  | "gujarati"
  | string;

export type TextAlignment = "left" | "center" | "right" | "justify";
export type TextAlign = TextAlignment;

export interface FontDetectionMetadata {
  rawName: string;
  normalizedFamily: string;
  mappedFont: string;
  isExact: boolean;
  confidence: number;
  flags?: {
    isSerif?: boolean;
    isMonospace?: boolean;
    isBold?: boolean;
    isItalic?: boolean;
  };
}

export interface TextRun {
  id: string;
  text: string;
  fontFamily: string;
  fontCategory: FontChoice;
  fontSize: number; // in PDF points
  isBold: boolean;
  isItalic: boolean;
  isUnderline?: boolean;
  color: { r: number; g: number; b: number };
  userOverride?: boolean;
  embeddedFontFamily?: string;
}

export interface ParagraphLayout {
  columnX: number; // PDF points left edge
  columnWidth: number; // PDF points width (median right edge minus column left edge)
  firstLineIndent: number; // in pt (first line x - column left edge)
  lineHeight: number; // in pt (median baseline-to-baseline distance)
  textAlign: TextAlignment;
  isLineMode: boolean; // if true, paragraph grouping confidence was low; each line is isolated
  letterSpacing?: number;
  wordSpacing?: number;
  paragraphSpacing?: number; // in pt (vertical gap to next paragraph)
  spaceBefore?: number; // in pt
  spaceAfter?: number; // in pt
}

export interface OriginalLine {
  text: string;
  x: number; // PDF points
  y: number; // PDF points
  width: number;
  height: number;
  runs?: TextRun[];
}

export interface TextBlock {
  id: string;
  pageIndex: number;
  originalText: string;
  currentText: string;

  // PDF point coordinates (origin at bottom-left)
  x: number; // Baseline X
  y: number; // Baseline Y
  pdfBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  originalLines?: OriginalLine[];
  runs?: TextRun[];
  layout?: ParagraphLayout;

  // Viewport/Canvas pixel coordinates for DOM overlay
  viewportBounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };

  fontSize: number; // in PDF points
  fontFamily: string; // e.g. "Calibri", "Arial", "Times New Roman", "Carlito", etc.
  fontCategory: FontChoice;
  fontName?: string; // original PDF font name e.g. "ABCDEF+Calibri-Bold"
  isSubstitutedFont?: boolean;
  substitutedFontName?: string;
  detection?: FontDetectionMetadata;
  userOverride?: boolean;
  embeddedFontFamily?: string;

  isBold: boolean;
  isItalic: boolean;
  isUnderline?: boolean;
  textAlign: TextAlignment;

  color: { r: number; g: number; b: number }; // 0 to 1 scale
  bgColor?: { r: number; g: number; b: number }; // sampled background color (0 to 1)

  isNew?: boolean; // added via "Add Text" or empty-space click
  isDeleted?: boolean; // deleted block
  isEdited?: boolean; // modified by user
  isSingleLine?: boolean; // single line item (heading, label, table cell)
  lineHeight?: number; // relative line height multiplier (e.g. 1.25)
}

export interface PageTextData {
  pageIndex: number;
  width: number; // in PDF points
  height: number;
  rotate: number;
  blocks: TextBlock[];
  hasText: boolean;
}

export interface EditHistoryEntry {
  blocks: TextBlock[];
  selectedBlockId: string | null;
}

export interface NewTextBoxParams {
  pageIndex: number;
  x: number; // PDF points
  y: number;
  fontSize: number;
  fontFamily: string;
  fontCategory: FontChoice;
  color: { r: number; g: number; b: number };
  isBold: boolean;
  isItalic: boolean;
  isUnderline?: boolean;
  textAlign?: TextAlignment;
}

export type PageBorderStyle = "solid" | "double" | "dashed" | "dotted";
export type PageBorderScope = "all" | "current" | "custom" | "first-only" | "exclude-first";

export interface PageBorderConfig {
  enabled: boolean;
  style: PageBorderStyle;
  width: number; // 0.5 - 10 pt
  color: string; // hex color e.g. "#1e40af"
  margin: number; // 10 - 100 pt
  cornerRadius?: number; // 0 - 50 pt
  scope: PageBorderScope;
  customRange?: string; // e.g. "1, 3-5"
  targetPageIndex?: number;
}

/**
 * Determines whether a specific page should receive a border based on scope settings.
 */
export function shouldPageHaveBorder(
  config: PageBorderConfig | undefined | null,
  pageIndex: number,
  totalPages = 1
): boolean {
  if (!config || !config.enabled || totalPages <= 0) return false;
  const pageNum = pageIndex + 1; // 1-based

  switch (config.scope) {
    case "all":
      return true;
    case "current":
      return config.targetPageIndex !== undefined ? config.targetPageIndex === pageIndex : true;
    case "first-only":
      return pageIndex === 0;
    case "exclude-first":
      return pageIndex > 0;
    case "custom": {
      if (!config.customRange) return false;
      const parts = config.customRange.split(",").map((s) => s.trim());
      for (const part of parts) {
        if (part.includes("-")) {
          const [startStr, endStr] = part.split("-").map((s) => parseInt(s.trim(), 10));
          if (!isNaN(startStr) && !isNaN(endStr)) {
            const min = Math.min(startStr, endStr);
            const max = Math.max(startStr, endStr);
            if (pageNum >= min && pageNum <= max) {
              return true;
            }
          }
        } else {
          const num = parseInt(part, 10);
          if (!isNaN(num) && num === pageNum) {
            return true;
          }
        }
      }
      return false;
    }
    default:
      return true;
  }
}


