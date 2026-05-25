# Contributing to CMS Detector

Thanks for helping improve the signature database. This document explains how to add new CMS signatures, extend existing ones, add test cases, and verify favicon hashes.

---

## Adding a new CMS signature

Open `cms-detector.js` and add a new entry to `this.signatures` inside the constructor. Use this template:

```javascript
myplatform: {
  paths:     [],   // CMS-specific paths — only very specific ones (e.g. /wp-login.php)
  headers:   [],   // HTTP response header keys (lowercase)
  poweredBy: [],   // Patterns for X-Powered-By or Server header values
  meta:      [],   // <meta name="generator"> content patterns
  html:      [],   // Raw HTML patterns — needs ≥2 matches to score (avoid generic strings)
  scripts:   [],   // <script src=""> URL patterns
  links:     [],   // <link href=""> URL patterns
  cookies:   [],   // Set-Cookie name patterns (prefix matching)
  jsVars:    [],   // Global JS variable/object names present in HTML source
  htmlAttrs: [],   // Patterns matched against the <html> opening tag only
  robots:    [],   // Patterns in robots.txt or sitemap.xml (needs ≥2 matches)
  feed:      [],   // Patterns in RSS/Atom feed body or <generator> tag
  errorPage: [],   // Patterns in 404 response body (needs ≥2 matches)
  faviconHashes: [], // MD5 hashes of /favicon.ico bytes (see section below)
  versionPatterns: [ // Regex patterns to extract version strings
    { regex: /MyPlatform ([\d.]+)/i, label: 'Version string in source' }
  ],
  negates:   [],   // CMS names this system mutually excludes (ratio > 3:1)
},
```

### Rules for good signatures

**Be specific.** A pattern that appears on thousands of non-CMS sites will generate false positives. Ask: "would this string appear on a site NOT running this CMS?"

**HTML patterns need 2+ matches to score.** A single HTML pattern is never enough. Add at least 3 patterns so that 2 can match independently.

**robots.txt and errorPage need 2+ matches.** Same reasoning — these sources can be generic.

**paths should be very specific.** `/admin/` is useless. `/wp-login.php` is good. Only add paths that return 200 or 403 exclusively on this CMS.

**jsVars should be globals, not substrings.** `__NEXT_DATA__` is a good JS var. `data` is not.

**versionPatterns should capture group 1 as the version string:**
```javascript
{ regex: /Ghost\/([\d.]+)/i, label: 'Ghost version in source' }
```

---

## Adding CDN domain signals

If the CMS uses a specific CDN or asset domain that no other platform uses, add it to `this.cdnSignals`:

```javascript
myplatform: ['assets.myplatform.com', 'cdn.myplatform.io'],
```

CDN signals are matched against all external URLs (`src`, `href`, CSS `url()`) in the HTML. One match scores 30 points. Only add domains that are **exclusive** to this platform.

---

## Adding DNS fingerprints

If the platform is SaaS-hosted and users point a CNAME to it, add a CNAME pattern to `this.dnsFingerprints`:

```javascript
myplatform: { cname: ['myplatform.io', 'sites.myplatform.com'] },
```

Patterns are substring-matched against the resolved CNAME target. A match scores 70 points — the highest single-channel weight. Only add CNAME targets that are exclusive to this platform.

---

## Adding favicon hashes

The favicon hash channel identifies CMS by the MD5 hash of the raw bytes of `/favicon.ico`. To generate a hash:

```bash
curl -s https://example-wordpress-site.com/favicon.ico | md5sum
```

Or with Node.js:

```javascript
const https  = require('https');
const crypto = require('crypto');

https.get('https://example.com/favicon.ico', res => {
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    console.log(crypto.createHash('md5').update(Buffer.concat(chunks)).digest('hex'));
  });
});
```

Add verified hashes to `this.faviconHashes` in the constructor:

```javascript
this.faviconHashes = {
  'abc123...': 'wordpress',
  'def456...': 'joomla',
};
```

**Important:** Verify hashes against multiple independent installations of the same CMS version. Default favicons shipped with CMS themes are good candidates. Custom favicons will differ per site.

---

## Adding test cases

Open `test.js` and add an entry to the `TESTS` array:

```javascript
{
  domain:    'example-myplatform-site.com',
  expect:    ['myplatform'],
  notExpect: ['wordpress'],   // optional — false-positive guard
  minConf:   'medium',        // 'low' | 'medium' | 'high'
  note:      'Well-known public MyPlatform site, stable since 2022'
},
```

### Rules for test cases

- Only add **public, stable, well-known** domains that are unlikely to change CMS.
- Do not add personal websites, client websites, or sites that require authentication.
- `minConf: 'low'` is acceptable for headless systems and SSGs that expose few HTML markers.
- `notExpect` is optional but encouraged when two CMS are frequently confused.
- Run the test before submitting: `node test.js myplatform`

---

## Running tests locally

```bash
# All tests
node test.js

# Filter by keyword (domain, CMS name, or note text)
node test.js wordpress
node test.js shopify
node test.js headless
```

A passing test suite is required for pull requests that modify scoring logic or add new signatures that affect existing CMS.

---

## Pull request checklist

- [ ] New signature follows the template and rules above
- [ ] HTML patterns: at least 3 entries (so 2 can match independently)
- [ ] No overly generic patterns (single common words, `/admin/`, etc.)
- [ ] CDN domains are exclusive to this platform
- [ ] At least one test case added for new CMS
- [ ] `node test.js` passes without regressions
- [ ] Favicon hashes are verified against real installations (if added)

---

## Reporting false positives

Open an issue with:
1. The domain that was incorrectly detected
2. The actual CMS (if known)
3. Which CMS was falsely reported and at what confidence
4. The indicators listed in the `found` array of the result

This helps identify overly broad patterns that need tightening.
