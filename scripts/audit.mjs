#!/usr/bin/env node

/**
 * PDFivo Site Audit Script
 * ----------------------------------------------------
 * Crawls and verifies the built static site in out/:
 *  1. Broken internal links, 404s, redirect chains, anchor IDs.
 *  2. Missing title, meta description, canonical, or OG/Twitter tags.
 *  3. Duplicate titles or meta descriptions across all pages.
 *  4. Heading structure: strictly one <h1>, no skipped heading levels.
 *  5. Images without alt attributes.
 *  6. Any noindex tags on public pages.
 *  7. Sitemap synchronization (all public pages in sitemap, all sitemap URLs return 200).
 *  8. JSON-LD syntax and required schema properties validation.
 *  9. Orphan pages (0 incoming internal links).
 * 10. Cross-linking:
 *      - Every tool page links to 3-4 related tools.
 *      - Home page links to all 14 tools.
 *      - Footer links to every key page (14 tools + 5 company pages).
 *
 * Exits with code 1 on any failure, 0 on 100% pass.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SERVER_APP_DIR = path.resolve(ROOT_DIR, ".next", "server", "app");
const EXPORT_DIR = path.resolve(ROOT_DIR, "out");
const OUT_DIR = fs.existsSync(SERVER_APP_DIR) ? SERVER_APP_DIR : EXPORT_DIR;
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pdfivo.co").replace(/\/+$/, "");

const ALL_14_TOOL_SLUGS = [
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "rotate-pdf",
  "delete-pages",
  "organize-pdf",
  "pdf-to-jpg",
  "jpg-to-pdf",
  "watermark-pdf",
  "page-numbers-pdf",
  "sign-pdf",
  "protect-pdf",
  "unlock-pdf",
  "edit-pdf",
];

const COMPANY_PAGE_ROUTES = ["/about", "/privacy", "/terms", "/contact", "/blog"];

// ANSI Colors for console output
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Test results aggregator
const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

function pass(category, message) {
  results.passed++;
  console.log(`  ${colors.green}✓${colors.reset} [${category}] ${message}`);
}

function fail(category, message) {
  results.failed++;
  const formatted = `[${category}] ${message}`;
  results.errors.push(formatted);
  console.log(`  ${colors.red}✗${colors.reset} ${formatted}`);
}

function normalizeRoute(route) {
  if (!route || route === "/") return "/";
  return route.replace(/\/+$/, "");
}

/**
 * Scan out/ directory for all HTML pages.
 */
function discoverPages() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error(
      `${colors.red}Error:${colors.reset} out/ directory not found. Please run 'npm run build' first.`
    );
    process.exit(1);
  }

  const publicPages = new Map(); // route -> { filePath, html, route }
  const allHtmlFiles = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        allHtmlFiles.push(fullPath);
      }
    }
  }

  scan(OUT_DIR);

  for (const filePath of allHtmlFiles) {
    const rel = path.relative(OUT_DIR, filePath);
    // Ignore error/internal pages for public index
    if (
      rel === "404.html" ||
      rel === "_not-found.html" ||
      rel.startsWith("_not-found") ||
      rel === "_global-error.html" ||
      rel.startsWith("_global-error")
    ) {
      continue;
    }

    let route = "/" + rel.replace(/\.html$/, "").replace(/\/index$/, "");
    if (route === "/index" || route === "") {
      route = "/";
    }
    route = normalizeRoute(route);

    const html = fs.readFileSync(filePath, "utf-8");
    publicPages.set(route, { filePath, relPath: rel, html, route });
  }

  return { publicPages, allHtmlFiles };
}

/**
 * Check Sitemap.xml and HTTP 200 verification
 */
function checkSitemap(publicPages) {
  console.log(`\n${colors.bold}${colors.cyan}--- Checking Sitemap & URL Status ---${colors.reset}`);
  let sitemapPath = path.join(OUT_DIR, "sitemap.xml");
  if (!fs.existsSync(sitemapPath) || !fs.statSync(sitemapPath).isFile()) {
    sitemapPath = path.join(OUT_DIR, "sitemap.xml.body");
  }
  if (!fs.existsSync(sitemapPath) || !fs.statSync(sitemapPath).isFile()) {
    fail("Sitemap", "sitemap.xml not found in build directory");
    return;
  }

  const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
  const locMatches = [...sitemapContent.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) =>
    m[1].trim()
  );

  if (locMatches.length === 0) {
    fail("Sitemap", "sitemap.xml contains 0 <loc> URLs");
    return;
  }

  pass("Sitemap Parse", `Successfully parsed ${locMatches.length} URLs from sitemap.xml`);

  let sitemapUrlErrors = 0;
  const sitemapRoutes = new Set();
  for (const url of locMatches) {
    if (!url.startsWith(BASE_URL)) {
      fail("Sitemap Domain", `Sitemap URL does not start with ${BASE_URL}: ${url}`);
      sitemapUrlErrors++;
      continue;
    }

    let route = url.slice(BASE_URL.length);
    route = normalizeRoute(route);
    sitemapRoutes.add(route);

    // Verify sitemap URL returns 200 (exists in out/)
    let expectedFile;
    if (route === "/") {
      expectedFile = path.join(OUT_DIR, "index.html");
    } else {
      expectedFile = path.join(OUT_DIR, `${route.slice(1)}.html`);
      if (!fs.existsSync(expectedFile)) {
        expectedFile = path.join(OUT_DIR, route.slice(1), "index.html");
      }
    }

    if (!fs.existsSync(expectedFile)) {
      fail(
        "Sitemap 200",
        `Sitemap URL does not return 200 / file missing: ${url} (looked for ${expectedFile})`
      );
      sitemapUrlErrors++;
    }
  }

  if (sitemapUrlErrors === 0) {
    pass(
      "Sitemap URLs",
      `All ${locMatches.length} URLs in sitemap.xml resolve to static files (HTTP 200 OK)`
    );
  }

  // Check all public pages are present in sitemap.xml
  let missingFromSitemap = 0;
  for (const [route] of publicPages) {
    if (!sitemapRoutes.has(route)) {
      fail("Sitemap Coverage", `Public page ${route} is missing from sitemap.xml`);
      missingFromSitemap++;
    }
  }

  if (missingFromSitemap === 0) {
    pass("Sitemap Coverage", `All ${publicPages.size} public pages are present in sitemap.xml`);
  }
}

/**
 * Check Titles, Descriptions, Canonicals, OG Tags, and Noindex
 */
function checkMetadataAndSEO(publicPages) {
  console.log(
    `\n${colors.bold}${colors.cyan}--- Checking Metadata, OG Tags, Titles & Descriptions ---${colors.reset}`
  );
  const titles = new Map(); // title -> [routes]
  const descriptions = new Map(); // desc -> [routes]

  let missingTitleCount = 0;
  let missingDescCount = 0;
  let missingCanonicalCount = 0;
  let missingOgCount = 0;
  let noindexCount = 0;

  for (const [route, { html }] of publicPages) {
    // 1. Title tag
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    if (!title) {
      fail("Title Tag", `Page ${route} is missing a <title> tag`);
      missingTitleCount++;
    } else {
      if (!titles.has(title)) titles.set(title, []);
      titles.get(title).push(route);
    }

    // 2. Meta description
    const descMatch =
      html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
    const desc = descMatch ? descMatch[1].trim() : null;
    if (!desc) {
      fail("Meta Description", `Page ${route} is missing a meta description`);
      missingDescCount++;
    } else {
      if (!descriptions.has(desc)) descriptions.set(desc, []);
      descriptions.get(desc).push(route);
    }

    // 3. Canonical tag
    const canonicalMatch =
      html.match(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']/i) ||
      html.match(/<link\s+href=["']([\s\S]*?)["']\s+rel=["']canonical["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;
    const expectedCanonical = `${BASE_URL}${route === "/" ? "" : route}`;
    if (!canonical) {
      fail("Canonical Tag", `Page ${route} is missing a canonical link tag`);
      missingCanonicalCount++;
    } else if (canonical !== expectedCanonical) {
      fail(
        "Canonical Tag",
        `Page ${route} has incorrect canonical: expected "${expectedCanonical}", found "${canonical}"`
      );
      missingCanonicalCount++;
    }

    // 4. OG & Twitter Tags
    const ogTitle =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta\s+content=["']([\s\S]*?)["']\s+property=["']og:title["']/i);
    if (!ogTitle || !ogTitle[1].trim()) {
      fail("OG Tags", `Page ${route} is missing property="og:title"`);
      missingOgCount++;
    }

    const ogDesc =
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta\s+content=["']([\s\S]*?)["']\s+property=["']og:description["']/i);
    if (!ogDesc || !ogDesc[1].trim()) {
      fail("OG Tags", `Page ${route} is missing property="og:description"`);
      missingOgCount++;
    }

    const ogUrl =
      html.match(/<meta\s+property=["']og:url["']\s+content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta\s+content=["']([\s\S]*?)["']\s+property=["']og:url["']/i);
    if (!ogUrl || !ogUrl[1].trim()) {
      fail("OG Tags", `Page ${route} is missing property="og:url"`);
      missingOgCount++;
    }

    const ogImage =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta\s+content=["']([\s\S]*?)["']\s+property=["']og:image["']/i);
    if (!ogImage || !ogImage[1].trim()) {
      fail("OG Tags", `Page ${route} is missing property="og:image"`);
      missingOgCount++;
    }

    const twitterCard =
      html.match(/<meta\s+name=["']twitter:card["']\s+content=["']([\s\S]*?)["']/i) ||
      html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']twitter:card["']/i);
    if (!twitterCard || !twitterCard[1].trim()) {
      fail("Twitter Tags", `Page ${route} is missing name="twitter:card"`);
      missingOgCount++;
    }

    // 5. Noindex check
    const robotsMatch = html.match(
      /<meta\s+[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["']([^"']*)["']/i
    );
    if (robotsMatch && /noindex/i.test(robotsMatch[1])) {
      fail("Indexing", `Page ${route} contains a 'noindex' directive: "${robotsMatch[0]}"`);
      noindexCount++;
    }
  }

  if (missingTitleCount === 0) {
    pass("Title Tags", `All ${publicPages.size} pages have valid, non-empty <title> tags`);
  }
  if (missingDescCount === 0) {
    pass(
      "Meta Descriptions",
      `All ${publicPages.size} pages have valid, non-empty meta descriptions`
    );
  }
  if (missingCanonicalCount === 0) {
    pass(
      "Canonical Tags",
      `All ${publicPages.size} pages have self-referencing absolute canonical URLs`
    );
  }
  if (missingOgCount === 0) {
    pass(
      "OG / Twitter Tags",
      `All ${publicPages.size} pages have complete Open Graph and Twitter card tags`
    );
  }
  if (noindexCount === 0) {
    pass(
      "Indexing Directives",
      `Zero noindex tags found across all ${publicPages.size} public pages`
    );
  }

  // Check for duplicate titles
  let duplicateTitleCount = 0;
  for (const [title, routes] of titles) {
    if (routes.length > 1) {
      fail(
        "Duplicate Titles",
        `Duplicate title "${title}" found on ${routes.length} pages: ${routes.join(", ")}`
      );
      duplicateTitleCount++;
    }
  }
  if (duplicateTitleCount === 0) {
    pass("Duplicate Titles", `All ${publicPages.size} page titles are strictly unique`);
  }

  // Check for duplicate descriptions
  let duplicateDescCount = 0;
  for (const [desc, routes] of descriptions) {
    if (routes.length > 1) {
      fail(
        "Duplicate Descriptions",
        `Duplicate description "${desc.slice(0, 50)}..." found on ${routes.length} pages: ${routes.join(", ")}`
      );
      duplicateDescCount++;
    }
  }
  if (duplicateDescCount === 0) {
    pass("Duplicate Descriptions", `All ${publicPages.size} meta descriptions are strictly unique`);
  }
}

/**
 * Check Headings: exactly one <h1>, no skipped heading levels.
 */
function checkHeadings(publicPages) {
  console.log(
    `\n${colors.bold}${colors.cyan}--- Checking Heading Hierarchy (h1 count & sequence) ---${colors.reset}`
  );

  let headingErrors = 0;
  for (const [route, { html }] of publicPages) {
    const headingRegex = /<h([1-6])(?:\s+[^>]*)?>([\s\S]*?)<\/h\1>/gi;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1], 10),
        raw: match[0],
        text: match[2]
          .replace(/<[^>]+>/g, "")
          .replace(/<!--[\s\S]*?-->/g, "")
          .trim(),
      });
    }

    const h1Headings = headings.filter((h) => h.level === 1);
    if (h1Headings.length === 0) {
      fail("H1 Hierarchy", `Page ${route} has zero <h1> tags`);
      headingErrors++;
    } else if (h1Headings.length > 1) {
      fail(
        "H1 Hierarchy",
        `Page ${route} has ${h1Headings.length} <h1> tags (expected strictly 1)`
      );
      headingErrors++;
    }

    if (headings.length > 0) {
      if (headings[0].level !== 1) {
        fail(
          "Heading Sequence",
          `Page ${route} first heading is <h${headings[0].level}> instead of <h1>`
        );
        headingErrors++;
      }

      for (let i = 1; i < headings.length; i++) {
        const prevLevel = headings[i - 1].level;
        const currLevel = headings[i].level;

        // Skipping levels down (e.g. h1 -> h3, h2 -> h4) is a violation
        if (currLevel > prevLevel + 1) {
          fail(
            "Heading Sequence",
            `Page ${route} skipped heading level: <h${prevLevel}> followed by <h${currLevel}> ("${headings[i].text.slice(0, 40)}")`
          );
          headingErrors++;
        }
      }
    }
  }

  if (headingErrors === 0) {
    pass(
      "Heading Hierarchy",
      `All ${publicPages.size} pages have strictly one <h1> and zero skipped heading levels`
    );
  }
}

/**
 * Check Images without alt attributes
 */
function checkImages(publicPages) {
  console.log(`\n${colors.bold}${colors.cyan}--- Checking Image Alt Attributes ---${colors.reset}`);
  let totalImages = 0;
  let missingAltCount = 0;

  for (const [route, { html }] of publicPages) {
    const imgRegex = /<img\s+([^>]*?)>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      totalImages++;
      const attrs = match[1];
      const hasAlt = /\balt=(?:"[^"]*"|'[^']*'|[^\s>]+)/i.test(attrs);
      if (!hasAlt) {
        fail("Image Alt", `Page ${route} has an <img> missing an alt attribute: ${match[0]}`);
        missingAltCount++;
      }
    }
  }

  if (missingAltCount === 0) {
    pass(
      "Image Alt Attributes",
      `Audited ${totalImages} static <img> tags; 0 missing alt attributes`
    );
  }
}

/**
 * Check JSON-LD Structured Data
 */
function checkJsonLd(publicPages) {
  console.log(
    `\n${colors.bold}${colors.cyan}--- Checking JSON-LD Structured Data ---${colors.reset}`
  );
  let totalSchemas = 0;
  let schemaErrors = 0;

  for (const [route, { html }] of publicPages) {
    const jsonLdRegex =
      /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      totalSchemas++;
      const rawJson = match[1].trim();

      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (err) {
        fail("JSON-LD Syntax", `Page ${route} has invalid JSON-LD syntax: ${err.message}`);
        schemaErrors++;
        continue;
      }

      const schemas = Array.isArray(parsed) ? parsed : [parsed];
      for (const schema of schemas) {
        if (!schema["@context"] || !schema["@context"].includes("schema.org")) {
          fail(
            "JSON-LD Context",
            `Page ${route} schema missing valid @context: ${JSON.stringify(schema["@context"])}`
          );
          schemaErrors++;
        }
        if (!schema["@type"]) {
          fail("JSON-LD Type", `Page ${route} schema missing @type`);
          schemaErrors++;
        }

        // Validate specific schema types
        const type = schema["@type"];
        if (type === "Organization" || type === "WebSite") {
          if (!schema.name || !schema.url) {
            fail("JSON-LD Schema", `Page ${route} ${type} missing required name or url`);
            schemaErrors++;
          }
        } else if (type === "SoftwareApplication") {
          if (!schema.name || !schema.applicationCategory || !schema.offers) {
            fail("JSON-LD Schema", `Page ${route} SoftwareApplication missing required properties`);
            schemaErrors++;
          }
        } else if (type === "FAQPage") {
          if (
            !schema.mainEntity ||
            !Array.isArray(schema.mainEntity) ||
            schema.mainEntity.length === 0
          ) {
            fail("JSON-LD Schema", `Page ${route} FAQPage has empty or invalid mainEntity`);
            schemaErrors++;
          }
        } else if (type === "BreadcrumbList") {
          if (
            !schema.itemListElement ||
            !Array.isArray(schema.itemListElement) ||
            schema.itemListElement.length === 0
          ) {
            fail("JSON-LD Schema", `Page ${route} BreadcrumbList has invalid itemListElement`);
            schemaErrors++;
          }
        } else if (type === "Article") {
          if (!schema.headline || !schema.author || !schema.datePublished) {
            fail(
              "JSON-LD Schema",
              `Page ${route} Article missing headline, author, or datePublished`
            );
            schemaErrors++;
          }
        }
      }
    }
  }

  if (schemaErrors === 0) {
    pass(
      "JSON-LD Validation",
      `Validated ${totalSchemas} JSON-LD structured data blocks across all pages (0 errors)`
    );
  }
}

/**
 * Check Internal Links, 404s, Redirect Chains, Anchors, and Build Link Graph
 */
function checkLinksAndOrphans(publicPages) {
  console.log(
    `\n${colors.bold}${colors.cyan}--- Checking Internal Links, 404s, Redirects & Orphan Pages ---${colors.reset}`
  );

  const incomingLinks = new Map(); // targetRoute -> Set(sourceRoute)
  for (const [route] of publicPages) {
    incomingLinks.set(route, new Set());
  }

  // Pre-index anchor IDs for all public pages
  const pageAnchorIds = new Map();
  for (const [route, { html }] of publicPages) {
    const ids = new Set();
    const idRegex = /(?:id|name)=["']([^"']+)["']/gi;
    let match;
    while ((match = idRegex.exec(html)) !== null) {
      ids.add(match[1]);
    }
    pageAnchorIds.set(route, ids);
  }

  let totalInternalLinks = 0;
  let linkErrors = 0;

  for (const [sourceRoute, { html }] of publicPages) {
    const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
    let match;

    while ((match = anchorRegex.exec(html)) !== null) {
      let href = match[1].trim();

      // Skip non-internal links
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.startsWith("blob:")
      ) {
        continue;
      }

      // Check for redirect domain links
      if (
        href.startsWith("http://pdfivo.co") ||
        href.startsWith("https://www.pdfivo.co") ||
        href.startsWith("http://www.pdfivo.co")
      ) {
        fail("Redirect Chain", `Page ${sourceRoute} contains link to redirected domain: "${href}"`);
        linkErrors++;
      }

      let isInternal = false;
      let targetPath = "";
      let targetHash = null;

      if (href.startsWith(BASE_URL)) {
        isInternal = true;
        const parsed = new URL(href);
        targetPath = parsed.pathname;
        targetHash = parsed.hash ? parsed.hash.slice(1) : null;
      } else if (href.startsWith("/")) {
        isInternal = true;
        const [p, h] = href.split("#");
        targetPath = p.split("?")[0];
        targetHash = h || null;
      } else if (href.startsWith("#")) {
        // Same-page anchor
        const hash = href.slice(1);
        const pageIds = pageAnchorIds.get(sourceRoute);
        if (!pageIds || !pageIds.has(hash)) {
          fail("Broken Anchor", `Page ${sourceRoute} links to non-existent anchor "${href}"`);
          linkErrors++;
        }
        continue;
      } else {
        // External link (e.g. https://github.com/...)
        continue;
      }

      if (isInternal) {
        totalInternalLinks++;
        const normalizedTarget = normalizeRoute(targetPath);

        // Check for trailing-slash inconsistency or double slash
        if (targetPath.length > 1 && targetPath.endsWith("/")) {
          fail(
            "Redirect Chain",
            `Page ${sourceRoute} has link with trailing slash: "${href}" (should be "${normalizedTarget}")`
          );
          linkErrors++;
        }
        if (targetPath.includes("//")) {
          fail("Broken Link", `Page ${sourceRoute} has double slashes in link: "${href}"`);
          linkErrors++;
        }

        // Verify target page exists in out/ (avoid 404)
        if (!publicPages.has(normalizedTarget)) {
          fail(
            "Broken Internal Link (404)",
            `Page ${sourceRoute} links to non-existent page "${href}"`
          );
          linkErrors++;
        } else {
          // If anchor specified, verify it exists on target page
          if (targetHash) {
            const targetIds = pageAnchorIds.get(normalizedTarget);
            if (!targetIds || !targetIds.has(targetHash)) {
              fail(
                "Broken Anchor",
                `Page ${sourceRoute} links to anchor "${href}", but id="${targetHash}" was not found on ${normalizedTarget}`
              );
              linkErrors++;
            }
          }

          // Record incoming link for orphan check (ignore self-links)
          if (sourceRoute !== normalizedTarget) {
            incomingLinks.get(normalizedTarget)?.add(sourceRoute);
          }
        }
      }
    }
  }

  if (linkErrors === 0) {
    pass(
      "Internal Links & 404s",
      `Audited ${totalInternalLinks} internal links across all pages; 0 broken links, 0 404s, 0 broken anchors`
    );
  }

  // Check for Orphan Pages
  const orphanPages = [];
  for (const [route, sources] of incomingLinks) {
    if (route === "/") continue; // Root homepage is the entrypoint
    if (sources.size === 0) {
      orphanPages.push(route);
      fail("Orphan Pages", `Page ${route} has 0 incoming internal links`);
    }
  }

  if (orphanPages.length === 0) {
    pass(
      "Orphan Pages Check",
      `Zero orphan pages: all ${publicPages.size} pages have incoming internal links`
    );
  }
}

/**
 * Check Specific Cross-Linking Requirements:
 *  - Every tool page links to 3-4 related tools
 *  - The home page links to all 14 tools
 *  - The footer links to every key page (14 tools + 5 company pages)
 */
function checkCrossLinking(publicPages) {
  console.log(
    `\n${colors.bold}${colors.cyan}--- Checking Cross-Linking Requirements ---${colors.reset}`
  );

  // 1. Home page links to all 14 tools
  const homeData = publicPages.get("/");
  if (!homeData) {
    fail("Home Tool Directory", "Home page (/) was not found in public pages");
  } else {
    const homeHtml = homeData.html;
    const missingToolsOnHome = [];
    for (const toolSlug of ALL_14_TOOL_SLUGS) {
      const toolLinkRegex = new RegExp(`href=["'](?:${BASE_URL})?/${toolSlug}["']`, "i");
      if (!toolLinkRegex.test(homeHtml)) {
        missingToolsOnHome.push(toolSlug);
      }
    }

    if (missingToolsOnHome.length > 0) {
      fail(
        "Home Tool Directory",
        `Home page is missing links to ${missingToolsOnHome.length} tools: ${missingToolsOnHome.join(", ")}`
      );
    } else {
      pass(
        "Home Tool Directory",
        `Home page (/) links directly to all ${ALL_14_TOOL_SLUGS.length} tools`
      );
    }
  }

  // 2. Every tool page links to 3-4 related tools
  let allToolsValid = true;
  for (const toolSlug of ALL_14_TOOL_SLUGS) {
    const toolRoute = `/${toolSlug}`;
    const toolData = publicPages.get(toolRoute);
    if (!toolData) {
      fail("Tool Related Cross-Linking", `Tool page ${toolRoute} does not exist in built site`);
      allToolsValid = false;
      continue;
    }

    const html = toolData.html;
    const relatedSectionMatch = html.match(/Related\s+PDF\s+Tools[\s\S]*?<\/section>/i);
    const searchScope = relatedSectionMatch ? relatedSectionMatch[0] : html;

    const linkedTools = new Set();
    for (const otherSlug of ALL_14_TOOL_SLUGS) {
      if (otherSlug === toolSlug) continue;
      const regex = new RegExp(`href=["'](?:${BASE_URL})?/${otherSlug}["']`, "i");
      if (regex.test(searchScope)) {
        linkedTools.add(otherSlug);
      }
    }

    if (linkedTools.size < 3 || linkedTools.size > 4) {
      allToolsValid = false;
      fail(
        "Tool Related Cross-Linking",
        `Tool page ${toolRoute} links to ${linkedTools.size} related tools (expected 3-4, found: ${[...linkedTools].join(", ")})`
      );
    }
  }

  if (allToolsValid) {
    pass(
      "Tool Related Cross-Linking",
      `All 14 tool pages link to 3-4 related tools in their related section`
    );
  }

  // 3. Footer links to every key page
  const footerCheckPage = publicPages.get("/") || [...publicPages.values()][0];
  const footerMatch = footerCheckPage.html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);

  if (!footerMatch) {
    fail("Footer Architecture", "Footer element not found in HTML");
  } else {
    const footerHtml = footerMatch[1];
    const missingFooterCompany = [];
    for (const companyRoute of COMPANY_PAGE_ROUTES) {
      const regex = new RegExp(`href=["'](?:${BASE_URL})?${companyRoute}["']`, "i");
      if (!regex.test(footerHtml)) {
        missingFooterCompany.push(companyRoute);
      }
    }

    const missingFooterTools = [];
    for (const toolSlug of ALL_14_TOOL_SLUGS) {
      const regex = new RegExp(`href=["'](?:${BASE_URL})?/${toolSlug}["']`, "i");
      if (!regex.test(footerHtml)) {
        missingFooterTools.push(toolSlug);
      }
    }

    if (missingFooterCompany.length > 0) {
      fail(
        "Footer Architecture",
        `Footer missing company page links: ${missingFooterCompany.join(", ")}`
      );
    }
    if (missingFooterTools.length > 0) {
      fail("Footer Architecture", `Footer missing tool links: ${missingFooterTools.join(", ")}`);
    }

    if (missingFooterCompany.length === 0 && missingFooterTools.length === 0) {
      pass(
        "Footer Architecture",
        `Footer links to all ${COMPANY_PAGE_ROUTES.length} company pages and all ${ALL_14_TOOL_SLUGS.length} tools`
      );
    }
  }
}

/**
 * Main execution
 */
function runAudit() {
  console.log(
    `\n${colors.bold}====================================================${colors.reset}`
  );
  console.log(
    `${colors.bold}   PDFIVO AUTOMATED SITE AUDIT (${new Date().toISOString()})   ${colors.reset}`
  );
  console.log(`${colors.bold}====================================================${colors.reset}`);

  const { publicPages, allHtmlFiles } = discoverPages();
  console.log(
    `Found ${allHtmlFiles.length} total HTML files, ${publicPages.size} public indexable routes in out/`
  );

  checkSitemap(publicPages);
  checkMetadataAndSEO(publicPages);
  checkHeadings(publicPages);
  checkImages(publicPages);
  checkJsonLd(publicPages);
  checkLinksAndOrphans(publicPages);
  checkCrossLinking(publicPages);

  console.log(
    `\n${colors.bold}====================================================${colors.reset}`
  );
  console.log(`${colors.bold}AUDIT SUMMARY:${colors.reset}`);
  console.log(`  Passed checks: ${colors.green}${results.passed}${colors.reset}`);
  console.log(
    `  Failed checks: ${results.failed > 0 ? colors.red : colors.green}${results.failed}${colors.reset}`
  );
  console.log(`${colors.bold}====================================================${colors.reset}`);

  if (results.failed > 0) {
    console.error(
      `\n${colors.red}${colors.bold}AUDIT FAILED with ${results.failed} errors:${colors.reset}`
    );
    results.errors.forEach((err, idx) => {
      console.error(`  ${idx + 1}. ${err}`);
    });
    process.exit(1);
  } else {
    console.log(
      `\n${colors.green}${colors.bold}ALL CHECKS PASSED PERFECTLY! (Exit code 0)${colors.reset}\n`
    );
    process.exit(0);
  }
}

runAudit();
