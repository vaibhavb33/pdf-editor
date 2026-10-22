export type FontChoice =
  | "sans-serif"
  | "serif"
  | "monospace"
  | "calibri"
  | "cambria"
  | "roboto"
  | "devanagari"
  | "gujarati";

export type TextAlign = "left" | "center" | "right";

export interface OriginalLine {
  text: string;
  x: number; // PDF points
  y: number; // PDF points
  width: number;
  height: number;
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

  isBold: boolean;
  isItalic: boolean;
  isUnderline?: boolean;
  textAlign?: TextAlign;

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
  textAlign?: TextAlign;
}

