#!/usr/bin/env node
// test.js – CMS Detector v4 Test Suite
//
// Tests a curated set of domains with known CMS against the detector.
// Domains were chosen for stability and public availability.
//
// Usage:
//   node test.js              → run all tests
//   node test.js --fast       → skip slow checks (no path probing, no feed fetch)
//   node test.js wordpress    → run only tests matching a keyword

'use strict';

const CMSDetector = require('./cms-detector');

// ─── ANSI colours ────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
};

// ─── Test corpus ─────────────────────────────────────────────────────────────
// Format:
//   domain      – the URL to test
//   expect      – array of CMS names that MUST appear in detectedCMS
//   notExpect   – array of CMS names that must NOT appear (false-positive guard)
//   minConf     – minimum confidence for the first expected CMS ('low'|'medium'|'high')
//   note        – human-readable reason this domain was chosen
//
// Guidelines for adding tests:
//   • Only add domains that are stable, well-known, and unlikely to change CMS soon.
//   • Do not add personal or client websites.
//   • minConf 'low' is acceptable for headless/SSG systems that expose few markers.
//   • notExpect is optional but encouraged for CMS pairs that confuse easily.

const TESTS = [

  // ── WordPress ──────────────────────────────────────────────────────────────
  {
    domain:    'wordpress.org',
    expect:    ['wordpress'],
    notExpect: ['joomla', 'drupal'],
    minConf:   'high',
    note:      'Official WordPress site – maximum markers expected'
  },
  {
    domain:    'techcrunch.com',
    expect:    ['wordpress'],
    notExpect: ['joomla'],
    minConf:   'medium',
    note:      'High-traffic WordPress media site'
  },

  // ── Drupal ─────────────────────────────────────────────────────────────────
  {
    domain:    'drupal.org',
    expect:    ['drupal'],
    notExpect: ['wordpress', 'joomla'],
    minConf:   'high',
    note:      'Official Drupal site'
  },

  // ── TYPO3 ──────────────────────────────────────────────────────────────────
  {
    domain:    'typo3.org',
    expect:    ['typo3'],
    notExpect: ['wordpress'],
    minConf:   'high',
    note:      'Official TYPO3 site'
  },

  // ── Shopify ────────────────────────────────────────────────────────────────
  {
    domain:    'gymshark.com',
    expect:    ['shopify'],
    notExpect: ['woocommerce', 'magento'],
    minConf:   'medium',
    note:      'Large Shopify store – CDN + header signals'
  },
  {
    domain:    'allbirds.com',
    expect:    ['shopify'],
    notExpect: [],
    minConf:   'medium',
    note:      'Well-known Shopify brand'
  },

  // ── Wix ────────────────────────────────────────────────────────────────────
  {
    domain:    'wix.com',
    expect:    ['wix'],
    notExpect: ['wordpress'],
    minConf:   'high',
    note:      'Wix homepage – all signals present'
  },

  // ── Squarespace ────────────────────────────────────────────────────────────
  {
    domain:    'squarespace.com',
    expect:    ['squarespace'],
    notExpect: ['wix', 'webflow'],
    minConf:   'high',
    note:      'Squarespace homepage'
  },

  // ── Webflow ────────────────────────────────────────────────────────────────
  {
    domain:    'webflow.com',
    expect:    ['webflow'],
    notExpect: ['wix', 'squarespace'],
    minConf:   'high',
    note:      'Webflow homepage – meta + CDN + JS vars'
  },

  // ── Ghost ──────────────────────────────────────────────────────────────────
  {
    domain:    'ghost.org',
    expect:    ['ghost'],
    notExpect: ['wordpress'],
    minConf:   'high',
    note:      'Official Ghost site'
  },

  // ── Next.js ────────────────────────────────────────────────────────────────
  {
    domain:    'nextjs.org',
    expect:    ['nextjs'],
    notExpect: ['nuxtjs', 'gatsby'],
    minConf:   'medium',
    note:      'Next.js docs site – __NEXT_DATA__ + /_next/ paths'
  },

  // ── Nuxt.js ────────────────────────────────────────────────────────────────
  {
    domain:    'nuxt.com',
    expect:    ['nuxtjs'],
    notExpect: ['nextjs'],
    minConf:   'low',
    note:      'Nuxt homepage – /_nuxt/ paths'
  },

  // ── HubSpot CMS ────────────────────────────────────────────────────────────
  {
    domain:    'hubspot.com',
    expect:    ['hubspotcms'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'HubSpot – hs-scripts.com CDN + cookies'
  },

  // ── Contentful ─────────────────────────────────────────────────────────────
  {
    domain:    'contentful.com',
    expect:    ['contentful'],
    notExpect: [],
    minConf:   'low',
    note:      'Contentful homepage – ctfassets.net CDN'
  },

  // ── Framer ─────────────────────────────────────────────────────────────────
  {
    domain:    'framer.com',
    expect:    ['framer'],
    notExpect: ['webflow'],
    minConf:   'medium',
    note:      'Framer homepage – framerusercontent.com CDN'
  },

  // ── Laravel (framework detection) ──────────────────────────────────────────
  {
    domain:    'laravel.com',
    expect:    ['laravel'],
    notExpect: ['symfony'],
    minConf:   'low',
    note:      'Laravel docs – XSRF-TOKEN cookie + csrf-token meta'
  },

];

// ─── Confidence ordering ─────────────────────────────────────────────────────
const CONF_ORDER = { low: 0, medium: 1, high: 2 };

function confMeets(actual, minimum) {
  return (CONF_ORDER[actual] ?? -1) >= (CONF_ORDER[minimum] ?? 0);
}

// ─── Run one test ─────────────────────────────────────────────────────────────
async function runTest(detector, test, index, total) {
  const prefix = `${C.dim}[${String(index + 1).padStart(2)}/${total}]${C.reset}`;
  process.stdout.write(`${prefix} ${C.cyan}${test.domain.padEnd(30)}${C.reset} `);

  const start = Date.now();
  let result;
  try {
    result = await detector.detect(test.domain);
  } catch (err) {
    console.log(`${C.red}ERROR${C.reset} ${err.message}`);
    return { pass: false, domain: test.domain, error: err.message };
  }
  const elapsed = Date.now() - start;

  const failures = [];

  // Check expected CMS present
  for (const expected of test.expect) {
    if (!result.detectedCMS.includes(expected)) {
      failures.push(`Expected "${expected}" not found (got: ${result.detectedCMS.join(', ') || 'none'})`);
    } else {
      const conf = result.confidence[expected];
      if (!confMeets(conf, test.minConf)) {
        failures.push(`"${expected}" found but confidence "${conf}" < required "${test.minConf}"`);
      }
    }
  }

  // Check false-positive guard
  for (const notExp of (test.notExpect || [])) {
    if (result.detectedCMS.includes(notExp)) {
      failures.push(`False positive: "${notExp}" should NOT be detected`);
    }
  }

  const pass = failures.length === 0;
  const icon = pass ? `${C.green}✓ PASS${C.reset}` : `${C.red}✗ FAIL${C.reset}`;

  // Summary line
  const detected = result.detectedCMS.length
    ? result.detectedCMS.map(c => {
        const conf = result.confidence[c];
        const ver  = result.version?.[c] ? ` ${C.grey}v${result.version[c]}${C.reset}` : '';
        const col  = conf === 'high' ? C.green : conf === 'medium' ? C.yellow : C.dim;
        return `${col}${c}${C.reset}${ver}`;
      }).join(', ')
    : `${C.dim}none${C.reset}`;

  console.log(`${icon}  ${detected}  ${C.grey}${elapsed}ms${C.reset}`);

  if (!pass) {
    for (const f of failures) {
      console.log(`         ${C.red}→ ${f}${C.reset}`);
    }
  }

  if (result.error) {
    console.log(`         ${C.yellow}⚠ ${result.error}${C.reset}`);
  }

  return { pass, domain: test.domain, failures, elapsed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args    = process.argv.slice(2);
  const keyword = args.find(a => !a.startsWith('--'));

  let tests = TESTS;
  if (keyword) {
    tests = TESTS.filter(t =>
      t.domain.includes(keyword) ||
      t.expect.some(e => e.includes(keyword)) ||
      (t.note || '').toLowerCase().includes(keyword.toLowerCase())
    );
    if (tests.length === 0) {
      console.error(`No tests match keyword "${keyword}"`);
      process.exit(1);
    }
  }

  console.log(`\n${C.bold}CMS Detector v4 – Test Suite${C.reset}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`Running ${C.bold}${tests.length}${C.reset} tests`);
  if (keyword) console.log(`Filter: ${C.cyan}${keyword}${C.reset}`);
  console.log(`${'─'.repeat(60)}\n`);

  const detector = new CMSDetector();
  const results  = [];
  const start    = Date.now();

  for (let i = 0; i < tests.length; i++) {
    const r = await runTest(detector, tests[i], i, tests.length);
    results.push(r);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.pass).length;
  const failed  = results.length - passed;
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${C.bold}Results:${C.reset} ${C.green}${passed} passed${C.reset} · ${failed > 0 ? C.red : C.dim}${failed} failed${C.reset} · ${elapsed}s total`);

  if (failed > 0) {
    console.log(`\n${C.bold}Failed tests:${C.reset}`);
    for (const r of results.filter(r => !r.pass)) {
      console.log(`  ${C.red}✗${C.reset} ${r.domain}`);
      for (const f of (r.failures || [])) {
        console.log(`    ${C.dim}→ ${f}${C.reset}`);
      }
    }
    console.log();
    process.exit(1);
  }

  console.log(`\n${C.green}${C.bold}All tests passed.${C.reset}\n`);
  process.exit(0);
}

main().catch(err => {
  console.error(`\n${C.red}Fatal: ${err.message}${C.reset}`);
  process.exit(1);
});
