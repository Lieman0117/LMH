# AI Visibility Fixes — Branch: `ai-visibility-fixes`

## Files Modified / Created

### P0 — Brand Disambiguation

| File | Change |
|------|--------|
| `src/index.html` | Fixed `<p h1>` → proper `<h1>` containing "LMH Web Solutions"; added disambiguation line under hero; updated title + meta description to lead with full brand name |
| `src/_includes/sections/footer.html` | Added sitewide copyright credit: "© 2026 LMH Web Solutions — independent web studio for US tradespeople. Founded 2024 by Liam H." |
| `src/content/pages/about.html` | Full rewrite: h2 → h1, disambiguation block (styled callout), "hand-coded for 95+ Lighthouse, not templates" narrative, updated FAQ answers; title + meta updated |
| `src/content/pages/blog.html` | Updated title + meta to lead with "LMH Web Solutions" |
| `src/content/pages/contact.html` | Updated title + meta |
| `src/content/pages/project-one.html` | Updated title + meta (was "Code Stitch Web Designs"!) |
| `src/content/pages/project-two.html` | Updated title + meta (was "Code Stitch Web Designs"!) |
| `src/content/pages/reviews.html` | Updated title + meta (was "Code Stitch Web Designs"!) |
| `src/_data/client.js` | Removed placeholder phone number `(555) 779-4407` |

### P1 — JSON-LD Schema

| File | Change |
|------|--------|
| `src/_includes/components/home-schema.html` | Replaced `LocalBusiness` schema with full `Organization` schema: name, alternateName, url, logo, email, founder (Liam H), foundingDate (2024), areaServed (US), and disambiguation in description |
| `src/_includes/layouts/base.html` | Added Twitter card meta tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) to every page; fixed OG image fallback to use existing `Score.webp` |
| `src/content/pages/about.html` | Added `Person` JSON-LD schema (Liam H, Founder, LMH Web Solutions) |
| `src/content/pages/pricing.html` | Added `FAQPage` JSON-LD schema (7 Q&As) |
| `src/content/pages/lmh-vs-squarespace.html` | Added `FAQPage` JSON-LD schema (4 Q&As) |
| `src/content/pages/lmh-vs-wix.html` | Added `FAQPage` JSON-LD schema (4 Q&As) |
| `src/content/pages/lmh-vs-godaddy.html` | Added `FAQPage` JSON-LD schema (4 Q&As) |

### P2 — New Pages

| File | URL | Notes |
|------|-----|-------|
| `src/content/pages/pricing.html` | `/pricing/` | Single $175/month plan, 12 feature bullets, 7-item FAQ with FAQPage schema, "No setup fee. Cancel anytime." |
| `src/content/pages/lmh-vs-squarespace.html` | `/lmh-vs-squarespace/` | 8-row comparison table, "When Squarespace is better" section (5 bullets), 4-item FAQ |
| `src/content/pages/lmh-vs-wix.html` | `/lmh-vs-wix/` | 8-row comparison table, "When Wix is better" section (5 bullets), 4-item FAQ |
| `src/content/pages/lmh-vs-godaddy.html` | `/lmh-vs-godaddy/` | 8-row comparison table, "When GoDaddy is better" section (5 bullets), 4-item FAQ |
| `src/assets/less/page.less` | — | New shared LESS file for all new interior pages: page header, comparison table, pricing card, FAQ accordion, footer copyright bar, hero disambig text |

### P3 — Technical SEO

| File | Change |
|------|--------|
| `src/robots.html` | Added explicit `Allow: /` rules for `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` |
| `src/sitemap.html` | Updated all `<lastmod>` dates to 2026-05-06; added `/pricing/`, `/lmh-vs-squarespace/`, `/lmh-vs-wix/`, `/lmh-vs-godaddy/` |
| `src/_includes/sections/header.html` | Nav "Pricing" now links to `/pricing/` (was `/#pricing-1790`) |
| `src/_includes/sections/footer.html` | Added Pricing, vs Squarespace, vs Wix, vs GoDaddy to footer sitemap links |

**Canonical tags:** Already present on every page via `base.html` template (`<link rel="canonical" href="{{ client.domain }}{{ page.url }}">`). No change needed.

---

## Pages Blocked on User Input

### Case studies (`/case-studies/`)
> **Blocked** — task 10 requires real client data.  
> **Question to ask:** For Trusted Services VA and Vehicle Electronics US, can you provide: (a) before/after Lighthouse scores, (b) approximate time to launch, (c) a real results quote from the client?  
> Once provided, create `src/content/pages/case-studies/trusted-services-va.html` and `src/content/pages/case-studies/vehicle-electronics-us.html`.

### OG / social image
> **Manual TODO** — `base.html` currently falls back to `/assets/images/Score.webp` for OG/Twitter card images (the previous fallback `/assets/images/logo-small.png` does not exist in the repo). Ideally create a proper 1200×630px OG image and add it at `/assets/images/og-default.jpg`, then update `base.html` accordingly.

---

## JSON-LD Blocks Added — Paste into Google Rich Results Test

### 1. Organization schema — home page (`/`)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LMH Web Solutions",
  "alternateName": "lmhweb.solutions",
  "url": "https://lmhweb.solutions",
  "logo": "https://lmhweb.solutions/assets/svgs/logo-light.svg",
  "email": "liam@lmhweb.solutions",
  "founder": { "@type": "Person", "name": "Liam H" },
  "foundingDate": "2024",
  "areaServed": { "@type": "Country", "name": "United States" },
  "description": "Custom, hand-coded, Lighthouse-optimized websites for US tradespeople — electricians, painters, plumbers — on a monthly subscription with no upfront cost. Independent studio, not affiliated with LMH Agency or Lokal Media House."
}
```

### 2. Person schema — about page (`/about/`)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Liam H",
  "jobTitle": "Founder",
  "worksFor": {
    "@type": "Organization",
    "name": "LMH Web Solutions",
    "url": "https://lmhweb.solutions"
  }
}
```

### 3. FAQPage schema — pricing page (`/pricing/`)
7 questions covering: launch time, what's included, setup fees, code ownership, cancellation, edits after launch, what's not included.

### 4. FAQPage schema — `/lmh-vs-squarespace/`
4 questions covering: best for electricians, Lighthouse scores, switching, price difference.

### 5. FAQPage schema — `/lmh-vs-wix/`
4 questions covering: best for plumbers, Wix Lighthouse score, switching, site portability.

### 6. FAQPage schema — `/lmh-vs-godaddy/`
4 questions covering: best for trade businesses, hosting inclusion, switching, key difference.

**Rich Results Test URL:** https://search.google.com/test/rich-results  
Validate each page URL after deploying to Netlify. Organization and Person schemas may not trigger a "rich result" preview but will validate cleanly. FAQPage schemas should show FAQ rich result eligibility.

---

## git diff --stat

```
src/_data/client.js                       |   2 --
src/_includes/components/home-schema.html |  46 ++---
src/_includes/layouts/base.html           |   9 ++-
src/_includes/sections/footer.html        |  15 +++
src/_includes/sections/header.html        |   2 +-
src/content/pages/about.html              |  57 +++---
src/content/pages/blog.html               |   4 +-
src/content/pages/contact.html            |   4 +-
src/content/pages/project-one.html        |   4 +-
src/content/pages/project-two.html        |   4 +-
src/content/pages/reviews.html            |   4 +-
src/index.html                            |  13 +--
src/robots.html                           |  13 ++-
src/sitemap.html                          |  31 +++-
14 files changed, 129 insertions(+), 79 deletions(-)

New files (not in diff --stat):
  src/assets/less/page.less
  src/content/pages/pricing.html
  src/content/pages/lmh-vs-squarespace.html
  src/content/pages/lmh-vs-wix.html
  src/content/pages/lmh-vs-godaddy.html
```

---

## Lighthouse

Manual TODO — run after deploying to Netlify:
```
npx lighthouse https://lmhweb.solutions --output html --output-path lighthouse-home.html
npx lighthouse https://lmhweb.solutions/pricing/ --output html --output-path lighthouse-pricing.html
```

New pages use only hand-coded HTML + compiled LESS (no JS frameworks added). The `page.less` file adds ~3 KB of CSS with no render-blocking resources. Lighthouse impact should be negligible.

---

## Branch

`ai-visibility-fixes` — local only. **Not pushed. Not merged.**  
Run `git push -u origin ai-visibility-fixes` when ready to push for review.
