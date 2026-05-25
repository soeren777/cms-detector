# CMS Detector

A server-side CMS fingerprinting tool for Node.js. Detects **41 content management systems, frameworks and website builders** using **15 independent detection channels** with a weighted confidence scoring model.

> **Status: v0.8 Beta** — Architecture is stable and production-grade. Score thresholds are heuristic and have not yet been validated against a calibrated test corpus. See [Known Limitations](#known-limitations).

---

## Why this exists

Most CMS detectors do binary pattern matching: found / not found. This one builds a weighted evidence model across 15 independent channels, assigns confidence levels based on multi-channel corroboration, and extracts version numbers where possible — all without any external dependencies or browser automation.

**When to use this:**
- You need an on-premise, dependency-free CMS detection tool
- You want full control over signatures and scoring
- You're building an internal dashboard or pipeline tool
- You want to learn how fingerprinting systems work

**When to use [Wappalyzer](https://www.wappalyzer.com) instead:**
- You need 1,500+ technology signatures
- You need reliable detection on JavaScript-heavy SPAs
- You need a maintained, calibrated production tool

---

## Detected systems (41)

| Category | Systems |
|---|---|
| **Open Source CMS** | WordPress, Joomla, Drupal, TYPO3, Contao |
| **E-Commerce** | Shopify, Magento, WooCommerce, PrestaShop, OpenCart, OXID |
| **SaaS Builders** | Wix, Squarespace, Webflow, Ghost, Jimdo, Sitejet, HubSpot CMS, Weebly, Framer |
| **Headless / API-first** | Storyblok, Contentful, Sanity, Strapi, Builder.io, Prismic |
| **Static / JS Frameworks** | Next.js, Nuxt.js, Gatsby, Hugo, Jekyll, Eleventy |
| **PHP Frameworks** | Laravel, Symfony |
| **Enterprise CMS** | Pimcore, Neos, Craft CMS, Sitecore |
| **Community / Forum** | WoltLab, phpBB |
| **Other** | Mono |

---

## Detection channels (15)

| Channel | Weight | Method |
|---|---|---|
| DNS / CNAME | 70 | Resolves CNAME against 17 known SaaS targets |
| Meta Generator | 60 | `<meta name="generator">` tag |
| HTTP Header | 55 | CMS-specific response headers |
| X-Powered-By / Server | 55 | Header value matching |
| Cookie | 45 | `Set-Cookie` pattern matching |
| Path Probe | 40 | HEAD requests to CMS-specific paths |
| Favicon Hash | 40 | MD5 of `/favicon.ico` |
| Feed Generator | 35 | `<generator>` tag in RSS/Atom (2× if exact match) |
| JS Variables | 35 | Global JS object detection in HTML source |
| CDN Domain Signal | 30 | ~50 known asset/CDN domains across `src`, `href`, `url()` |
| HTML Attribute | 30 | `<html>` tag attribute patterns |
| robots.txt / sitemap | 25 | Path patterns in crawl files (min. 2 matches) |
| Script Tags | 25 | `<script src="">` pattern matching |
| 404 Error Page | 20 | CMS-specific error page fingerprinting (min. 2 matches) |
| Link Tags | 20 | `<link href="">` pattern matching |

Multi-channel bonus: +30 (≥2 channels), +60 (≥3), +90 (≥4 independent channels).

---

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/cms-detector.git
cd cms-detector
# No npm install needed — zero external dependencies
```

Requires **Node.js 16+**.

---

## Usage

### As a module

```javascript
const CMSDetector = require('./cms-detector');

const detector = new CMSDetector();
const result   = await detector.detect('example.com');

console.log(result);
// {
//   domain:       'example.com',
//   url:          'https://example.com',
//   detectedCMS:  ['wordpress'],
//   confidence:   { wordpress: 'high' },
//   details:      { wordpress: { score: 210, found: [...], channels: [...] } },
//   version:      { wordpress: '6.5.3' },
//   responseTime: 1842
// }
```

### As a CLI (quick test)

```bash
node -e "
const D = require('./cms-detector');
new D().detect(process.argv[1]).then(r => console.log(JSON.stringify(r, null, 2)));
" example.com
```

### API endpoint

The detector is designed to be called from an HTTP handler. Example with Node's built-in `http`:

```javascript
const http        = require('http');
const CMSDetector = require('./cms-detector');

const detector = new CMSDetector();

http.createServer(async (req, res) => {
  const url    = new URL(req.url, 'http://localhost');
  const domain = url.searchParams.get('domain');

  if (req.url.startsWith('/api/cms-detect') && domain) {
    const result = await detector.detect(domain);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  }
}).listen(3000);

// GET http://localhost:3000/api/cms-detect?domain=example.com
```

---

## Running tests

```bash
node test.js              # run all 15 tests
node test.js wordpress    # run tests matching keyword
node test.js shopify      # filter by CMS name or domain
```

Tests check that expected CMS are detected, that confidence meets the minimum threshold, and that known false positives do not appear.

---

## Response format

```typescript
{
  domain:       string,          // input domain
  url:          string,          // final URL after redirects
  detectedCMS:  string[],        // ordered by score, highest first
  confidence: {
    [cms: string]: 'high' | 'medium' | 'low'
  },
  details: {
    [cms: string]: {
      score:    number,          // raw weighted score
      found:    string[],        // human-readable list of matched indicators
      channels: string[]         // which detection channels fired
    }
  },
  version: {
    [cms: string]: string        // version string if detected, e.g. '6.5.3'
  },
  responseTime: number,          // ms for main page fetch
  error?:       string           // set if detection failed
}
```

---

## Known limitations

- **No test corpus calibration** — score thresholds (45 / 70 / 140) are heuristic, not data-driven. Precision and recall are unknown.
- **No JavaScript rendering** — SPAs and heavily client-side frameworks expose few markers in the initial HTML. For reliable detection of Next.js, Nuxt, Gatsby etc. a headless browser is needed.
- **Cloudflare masking** — ~20–25% of the web runs behind Cloudflare. Headers, IPs and sometimes CNAMEs are normalised, reducing detection accuracy on professionally-run sites.
- **Favicon hash database** — the built-in hash table is a placeholder. Populate `this.faviconHashes` with verified MD5 hashes from your own tests.
- **No caching** — every request fetches the target domain fresh. Add an in-memory cache if you're running bulk scans.
- **Version detection** — reliably tested for WordPress and Ghost only. Other CMS version patterns are best-effort.

---

## Adding signatures

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Quick version:

Each CMS entry in `this.signatures` follows this structure:

```javascript
myplatform: {
  paths:          [],   // CMS-specific paths to HEAD-check
  headers:        [],   // HTTP response header keys
  poweredBy:      [],   // X-Powered-By / Server header values
  meta:           [],   // <meta name="generator"> content patterns
  html:           [],   // raw HTML string patterns (min. 2 matches to score)
  scripts:        [],   // <script src=""> URL patterns
  links:          [],   // <link href=""> URL patterns
  cookies:        [],   // Set-Cookie name patterns
  jsVars:         [],   // global JS variable names in HTML source
  htmlAttrs:      [],   // <html> tag attribute patterns
  robots:         [],   // robots.txt / sitemap.xml patterns (min. 2 matches)
  feed:           [],   // RSS/Atom feed content patterns
  errorPage:      [],   // 404 response body patterns (min. 2 matches)
  faviconHashes:  [],   // MD5 hashes of favicon.ico bytes
  versionPatterns:[],   // { regex, label } for version extraction
  negates:        [],   // CMS names to suppress if this CMS scores 3× higher
}
```

Add CDN domains to `this.cdnSignals` and CNAME patterns to `this.dnsFingerprints`.

---

## Project status

| Component | Status |
|---|---|
| Architecture | ✅ Stable |
| 15 detection channels | ✅ Implemented |
| 41 CMS signatures | ✅ Implemented |
| Favicon hash database | ⚠️ Placeholder — needs real hashes |
| Test corpus | ⚠️ 15 domains — needs expansion |
| Score calibration | ❌ Not done |
| JS rendering support | ❌ Out of scope |

**Path to v1.0:** 200+ test domains, measured precision ≥ 90% on Top-20 CMS, verified favicon hashes.

---

## License

MIT
