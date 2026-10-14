# Deploying PDFivo to Vercel (Hobby Plan)

This guide provides exact, step-by-step instructions to deploy **PDFivo** to Vercel under the free Hobby plan, ensuring 100% static delivery via Vercel's global Edge CDN with zero serverless function usage.

---

## 1. Project Settings & Framework Preset

When importing the project in the [Vercel Dashboard](https://vercel.com/new):

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Next.js` | Vercel automatically detects Next.js App Router |
| **Root Directory** | `./` | Workspace root containing `package.json` |
| **Build Command** | `npm run build` | Default `next build` (standard build) |
| **Output Directory** | Automatically managed | Vercel natively detects `.next` build artifacts |
| **Install Command** | `npm install` | Default |
| **Node.js Version** | `20.x` or `22.x` | Set in Project Settings > General > Node.js Version |

---

## 2. Environment Variables

Configure the following environment variable in **Project Settings > Environment Variables**:

| Variable Name | Example Value | Environments | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | `https://pdfivo.co` | **Production**, **Preview**, **Development** | Dynamic canonical tags, sitemap.xml, robots.txt, OG URLs, and schema JSON-LD. No hardcoded domains. |

> [!TIP]
> For preview branches, Vercel automatically sets `VERCEL_URL`, but configuring `NEXT_PUBLIC_SITE_URL=https://pdfivo.co` in Production ensures production domain URLs are generated in all meta tags.

---

## 3. Custom Domain & DNS Setup

To attach your custom domain (`pdfivo.co`):

1. Navigate to **Project Settings > Domains**.
2. Add your apex domain: `pdfivo.co`.
3. Add the www subdomain: `www.pdfivo.co`.
4. Choose redirect preference: **Redirect `www.pdfivo.co` to `pdfivo.co`** (301 Permanent Redirect). This matches our canonical and `next.config.ts` rules.
5. In your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy):
   - **Apex Domain (`@`)**: Add an `A` record pointing to `76.76.21.21` (or CNAME flattening / ALIAS to `cname.vercel-dns.com`).
   - **Subdomain (`www`)**: Add a `CNAME` record pointing to `cname.vercel-dns.com`.
6. Vercel automatically provisions and renews a free Let's Encrypt SSL certificate with HTTPS enforced.

---

## 4. Architectural Guarantees for Free-Tier Limits

1. **100% Static & SSG Prerendering**:
   - All 20 public routes, 14 dynamic Open Graph images, web manifests, icons, `/sitemap.xml`, and `/robots.txt` are statically generated at build time.
   - Routes are marked with `○ (Static)` or `● (SSG)`.
   - Dynamic parameters are disabled (`dynamicParams = false`).
   - Requests hit Vercel's global CDN cache directly—zero server function invocations, staying well within Hobby plan limits.
2. **Client-Side Heavy Processing**:
   - PDF merging, compression, rendering, and signing run entirely inside the client's browser using Web Workers and WebAssembly.
   - Zero compute time or memory consumed on Vercel servers.
3. **Automated Security & HSTS**:
   - `next.config.ts` automatically attaches HSTS headers (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: SAMEORIGIN`, and strict referrer/mime policies to all responses.

---

## 5. Verification Commands

Before deploying or after linking the repository, run the local verification suite:

```bash
# 1. Type-check & lint
npm run type-check
npm run lint

# 2. Build production bundle (0 errors, 0 warnings)
npm run build

# 3. Automated site audit (18/18 checks pass)
npm run audit

# 4. In-browser PDF engine validation
npm run test:engine

# 5. Viewport responsiveness audit (320px, 375px, 768px, 1280px)
npm run test:viewports
```
