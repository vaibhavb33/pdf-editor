import { normalizePdfFontName, matchFontInCatalog, stripSubsetPrefix } from "../lib/pdf/font-catalog";

const testCases = [
  { raw: "ABCDEF+Calibri", expectedFamily: "Calibri", expectedMapped: "Carlito" },
  { raw: "BCDEFA+Arial-BoldMT", expectedFamily: "Arial", expectedMapped: "Liberation Sans" },
  { raw: "TimesNewRomanPS-BoldItalicMT", expectedFamily: "Times New Roman", expectedMapped: "Liberation Serif" },
  { raw: "CambriaMath", expectedFamily: "Cambria", expectedMapped: "Caladea" },
  { raw: "Poppins-SemiBold", expectedFamily: "Poppins", expectedMapped: "Poppins" },
  { raw: "Roboto-Medium", expectedFamily: "Roboto", expectedMapped: "Roboto" },
  { raw: "CMR10", expectedFamily: "Latin Modern Roman", expectedMapped: "Latin Modern Roman" },
  { raw: "LiberationSans", expectedFamily: "Liberation Sans", expectedMapped: "Liberation Sans" },
  { raw: "NotoSansDevanagari-Regular", expectedFamily: "Noto Sans Devanagari", expectedMapped: "Noto Sans Devanagari" },
  { raw: "NotoSansGujarati-Bold", expectedFamily: "Noto Sans Gujarati", expectedMapped: "Noto Sans Gujarati" },
  { raw: "DancingScript-Regular", expectedFamily: "Dancing Script", expectedMapped: "Dancing Script" },
  // Unknown sans-serif must NOT fall back to Times New Roman
  { raw: "UnknownBrandSans", flags: { isSerif: false }, expectedFamily: "Unknown Brand Sans", notExpected: "Times New Roman" },
  // Unknown serif
  { raw: "UnknownBrandSerif", flags: { isSerif: true }, expectedFamily: "Unknown Brand Serif", expectedMapped: "Liberation Serif" },
];

console.log("=== Testing Step 1: Auto Font Detection Pipeline ===");
let passed = 0;

for (const tc of testCases) {
  const norm = normalizePdfFontName(tc.raw);
  const match = matchFontInCatalog(tc.raw, undefined, tc.flags);

  const familyMatches = tc.expectedFamily ? match.detectedFamily.toLowerCase().includes(tc.expectedFamily.toLowerCase()) : true;
  const mappedMatches = tc.expectedMapped ? match.mappedFamily.toLowerCase() === tc.expectedMapped.toLowerCase() : true;
  const notExpectedMatches = tc.notExpected ? match.detectedFamily !== tc.notExpected && match.mappedFamily !== tc.notExpected : true;

  const ok = familyMatches && mappedMatches && notExpectedMatches;
  if (ok) {
    passed++;
    console.log(`[PASS] ${tc.raw} -> detected="${match.detectedFamily}", mapped="${match.mappedFamily}" (exact=${match.isExact}, conf=${match.confidence})`);
  } else {
    console.error(`[FAIL] ${tc.raw} -> detected="${match.detectedFamily}", mapped="${match.mappedFamily}"`);
  }
}

console.log(`\nResult: ${passed}/${testCases.length} tests passed.`);
if (passed === testCases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
