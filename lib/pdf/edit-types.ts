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
  // Viewport/Canvas pixel coordinates for DOM overlay
  viewportBounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  fontSize: number; // in PDF points
  fontFamily: string; // e.g. "Helvetica", "Times-Roman", "Courier", "sans-serif"
  fontName?: string; // original PDF font name if available
  isBold: boolean;
  isItalic: boolean;
  color: { r: number; g: number; b: number }; // 0 to 1 scale
  bgColor?: { r: number; g: number; b: number }; // sampled background color (0 to 1)
  isNew?: boolean; // added via "Add Text"
  isDeleted?: boolean; // deleted block
  isEdited?: boolean; // modified by user
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

export type FontChoice = "sans-serif" | "serif" | "monospace";

export interface NewTextBoxParams {
  pageIndex: number;
  x: number; // PDF points
  y: number;
  fontSize: number;
  fontFamily: FontChoice;
  color: { r: number; g: number; b: number };
  isBold: boolean;
  isItalic: boolean;
}
