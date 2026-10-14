# PDFivo (pdfivo.co)

> Free, unlimited online PDF utilities running 100% client-side in the browser. Zero server uploads, no logins, no paywalls.

Visit: [https://pdfivo.co](https://pdfivo.co)

---

## 🔒 Architecture & Privacy Principle

Traditional online PDF tools upload your sensitive personal and corporate documents (tax returns, legal contracts, medical reports) to remote cloud servers for processing.

**PDFivo operates differently:**

- **Zero Server Uploads**: PDF manipulation executes entirely client-side using browser **Web Workers** and **WebAssembly**.
- **No Network Payload**: No document byte ever leaves your device. You can verify this by checking your browser's Network inspector tab during any operation.
- **No Signups or Paywalls**: Completely free with unlimited daily usage.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, static generation `output: 'export'`)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Core PDF Engines**:
  - [`pdf-lib`](https://pdf-lib.js.org/) — Client-side creation and modification of PDF files.
  - [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) — In-browser PDF rendering for thumbnail generation and PDF-to-image exports.
  - [`jszip`](https://stuk.github.io/jszip/) — Client-side packaging of split pages and image bundles into ZIP archives.
  - [`browser-image-compression`](https://github.com/Donaldcwl/browser-image-compression) — Client-side image re-encoding and reduction.
- **Code Quality**: ESLint, Prettier

---

## 📁 Project Structure

```text
pdfivo/
├── app/                        # Next.js App Router pages and metadata routes
│   ├── [tool]/                 # Static tool page template (SSG via generateStaticParams)
│   ├── globals.css             # Tailwind v4 configuration and global design system
│   ├── layout.tsx              # Root layout with SEO metadata, JSON-LD, header & footer
│   ├── page.tsx                # Homepage featuring hero, trust pillars, and tools directory
│   ├── robots.ts               # Automated robots.txt generator
│   └── sitemap.ts              # Automated sitemap.xml generator
├── components/                 # Reusable UI & layout elements
│   ├── layout/                 # Header, Footer
│   ├── seo/                    # JsonLd structured data renderer
│   ├── tools/                  # ToolCard component
│   └── ui/                     # Badge, Button, Card
├── content/                    # Typed copy, metadata, and FAQ definitions
│   ├── index.ts                # Helper getters (getAllTools, getToolBySlug)
│   ├── site.ts                 # Site navigation, privacy pledge, branding
│   ├── tools.ts                # Catalog of all PDF tools with descriptions & FAQs
│   └── types.ts                # ToolDefinition, ToolFaq, ToolSeo interfaces
├── lib/
│   ├── pdf/                    # Core PDF modules (one module per tool)
│   │   ├── compress.ts         # PDF compression algorithms & image optimization
│   │   ├── convert.ts          # PDF-to-JPG and JPG-to-PDF handlers
│   │   ├── merge.ts            # PDF document merging
│   │   ├── organize.ts         # Page reordering and deletion
│   │   ├── protect.ts          # PDF password encryption
│   │   ├── rotate.ts           # Page orientation corrections
│   │   ├── split.ts            # Page extraction and splitting
│   │   ├── unlock.ts           # Password restriction removal
│   │   ├── types.ts            # Common progress callbacks & execution results
│   │   └── worker-client.ts    # Web Worker execution wrapper
│   └── seo/                    # Metadata and Schema.org generators
│       ├── metadata.ts         # Canonical URLs, OpenGraph, and Twitter tags
│       └── schema.ts           # WebSite, WebApplication, HowTo, and FAQ JSON-LD schemas
├── public/                     # Static assets (favicons, OpenGraph banners)
├── .prettierrc                 # Prettier code formatting rules
├── .prettierignore             # Prettier ignore patterns
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js configuration with static export enabled
├── package.json                # Dependencies and project scripts
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.15.0+` (or latest LTS)
- **npm**: `10+`

### 1. Installation

```bash
npm install
```

### 2. Development Server

Start the local development server at [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

### 3. Build & Static Generation (SSG)

Compile TypeScript, run lint checks, and statically export all pages to HTML in the `out/` directory:

```bash
npm run build
```

Every page (`/`, `/merge-pdf`, `/split-pdf`, `/compress-pdf`, etc.) is fully pre-rendered with all content in the initial HTML for optimal SEO performance and fast load times.

### 4. Code Quality & Formatting

```bash
# Run ESLint
npm run lint

# Check formatting with Prettier
npm run format:check

# Format files automatically
npm run format

# Run TypeScript type check
npm run type-check
```

---

## 🚢 Deployment

Because `next.config.ts` is configured with `output: "export"`, `npm run build` produces a self-contained static site inside the `out/` directory.

### Deploying to Cloudflare Pages

1. Build command: `npm run build`
2. Build output directory: `out`

### Deploying to Vercel

- Framework Preset: **Next.js**
- Override build settings if necessary: Output directory set to `out`.

### Deploying to Netlify / GitHub Pages / Any S3/CDN

Simply upload the contents of the `out/` directory to any static hosting provider.
