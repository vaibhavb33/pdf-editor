import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

async function generateTestPdf() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4: 595 x 842 pt
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // 1. One-line Heading
  page.drawText("ACKNOWLEDGEMENTS", {
    x: 200,
    y: 770,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // 2. Justified body paragraph with first-line indent and bold runs (names inside sentence)
  // Column X: 60pt, Column Width: 474pt (Right edge: 534pt)
  // First-line indent: +30pt (starts at 90pt)
  const line1_y = 720;
  const line2_y = 702;
  const line3_y = 684;
  const line4_y = 666;
  const targetRight = 534;

  // Helper for drawing justified text with word spacing
  function drawJustified(text: string, startX: number, y: number, endX: number, f: PDFFont) {
    const words = text.split(" ");
    let wordsWidth = 0;
    for (const w of words) wordsWidth += f.widthOfTextAtSize(w, 11);
    const spaceGap = words.length > 1 ? (endX - startX - wordsWidth) / (words.length - 1) : 0;
    let curX = startX;
    for (let i = 0; i < words.length; i++) {
      page.drawText(words[i], { x: curX, y, size: 11, font: f });
      curX += f.widthOfTextAtSize(words[i], 11) + spaceGap;
    }
  }

  // Line 1: Indented by 30pt. Starts at x = 90. Ends at x = 534.
  page.drawText("I would like to express my sincere gratitude to ", {
    x: 90,
    y: line1_y,
    size: 11,
    font: font,
  });
  page.drawText("Dr. Sarah Jenkins", {
    x: 334,
    y: line1_y,
    size: 11,
    font: fontBold,
  });
  const andWidth = font.widthOfTextAtSize(" and", 11);
  page.drawText(" and", {
    x: targetRight - andWidth,
    y: line1_y,
    size: 11,
    font: font,
  });

  // Line 2: Column margin x = 60. Ends at x = 534.
  page.drawText("my distinguished supervisor ", {
    x: 60,
    y: line2_y,
    size: 11,
    font: font,
  });
  page.drawText("Prof. Alan Turing", {
    x: 236,
    y: line2_y,
    size: 11,
    font: fontBold,
  });
  const guideText = " for their continuous guidance";
  const guideWidth = font.widthOfTextAtSize(guideText, 11);
  page.drawText(guideText, {
    x: targetRight - guideWidth,
    y: line2_y,
    size: 11,
    font: font,
  });

  // Line 3: Column margin x = 60. Ends at x = 534. Justified.
  drawJustified(
    "throughout this research project. Their invaluable support and feedback",
    60,
    line3_y,
    targetRight,
    font
  );

  // Line 4: Last line ends early (not justified across)
  page.drawText("made the completion of this thesis possible.", {
    x: 60,
    y: line4_y,
    size: 11,
    font: font,
  });

  // 3. Fallback Test 1: Isolated Table Cells / Grid (different X positions, small widths)
  page.drawText("TABLE 1: METRICS", { x: 60, y: 610, size: 10, font: fontBold });
  page.drawText("Parameter", { x: 60, y: 590, size: 9, font: fontBold });
  page.drawText("Baseline", { x: 220, y: 590, size: 9, font: fontBold });
  page.drawText("Optimized", { x: 380, y: 590, size: 9, font: fontBold });

  page.drawText("Throughput (MB/s)", { x: 60, y: 572, size: 9, font });
  page.drawText("142.5", { x: 220, y: 572, size: 9, font });
  page.drawText("589.2", { x: 380, y: 572, size: 9, font });

  // 4. Fallback Test 2: Two-column layout
  page.drawText("Column A: Primary observations indicate robust", { x: 60, y: 520, size: 9.5, font });
  page.drawText("convergence across all test iterations.", { x: 60, y: 506, size: 9.5, font });

  page.drawText("Column B: Secondary benchmarks demonstrate a 4x", { x: 310, y: 520, size: 9.5, font });
  page.drawText("reduction in client latency overhead.", { x: 310, y: 506, size: 9.5, font });

  // 5. Fallback Test 3: Indic Script line
  try {
    const fontkit = (await import("@pdf-lib/fontkit")).default;
    doc.registerFontkit(fontkit);
    const devaBytes = fs.readFileSync(path.resolve(process.cwd(), "public", "fonts", "noto-devanagari.ttf"));
    const devaFont = await doc.embedFont(devaBytes);
    page.drawText("Multilingual Support: Verification and Testing (हिन्दी)", {
      x: 60,
      y: 450,
      size: 10,
      font: devaFont,
    });
  } catch {
    page.drawText("Multilingual Support: Verification and Testing (Latin Fallback)", {
      x: 60,
      y: 450,
      size: 10,
      font: fontBold,
    });
  }

  const pdfBytes = await doc.save();
  const outPath = path.resolve(process.cwd(), "public", "test-acknowledgement.pdf");
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`Saved test PDF to: ${outPath} (${pdfBytes.length} bytes)`);
}

generateTestPdf().catch(console.error);
