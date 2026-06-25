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

  // ── WordPress (additional) ─────────────────────────────────────────────────
  {
    domain:    'theguardian.com',
    expect:    ['wordpress'],
    notExpect: ['drupal', 'joomla'],
    minConf:   'medium',
    note:      'Major news site on WordPress VIP'
  },
  {
    domain:    'blogs.nasa.gov',
    expect:    ['wordpress'],
    notExpect: ['drupal'],
    minConf:   'medium',
    note:      'NASA blogs – WordPress.com VIP government installation'
  },

  // ── WooCommerce ────────────────────────────────────────────────────────────
  {
    domain:    'woocommerce.com',
    expect:    ['woocommerce', 'wordpress'],
    notExpect: ['shopify', 'magento'],
    minConf:   'medium',
    note:      'Official WooCommerce site – both WooCommerce and WordPress expected'
  },

  // ── Joomla ─────────────────────────────────────────────────────────────────
  {
    domain:    'joomla.org',
    expect:    ['joomla'],
    notExpect: ['wordpress', 'drupal'],
    minConf:   'high',
    note:      'Official Joomla site – maximum markers expected'
  },

  // ── Drupal (additional) ────────────────────────────────────────────────────
  {
    domain:    'drupal.com',
    expect:    ['drupal'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'Drupal commercial site – Acquia hosted'
  },

  // ── TYPO3 (additional) ─────────────────────────────────────────────────────
  {
    domain:    'typo3.com',
    expect:    ['typo3'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'TYPO3 GmbH commercial site'
  },

  // ── Shopify (additional) ───────────────────────────────────────────────────
  {
    domain:    'kylie cosmetics.com',
    expect:    ['shopify'],
    notExpect: ['woocommerce'],
    minConf:   'medium',
    note:      'High-profile Shopify store'
  },
  {
    domain:    'shop.tesla.com',
    expect:    ['shopify'],
    notExpect: ['magento'],
    minConf:   'medium',
    note:      'Tesla merchandise shop on Shopify'
  },

  // ── Magento ────────────────────────────────────────────────────────────────
  {
    domain:    'magento.com',
    expect:    ['magento'],
    notExpect: ['shopify', 'woocommerce'],
    minConf:   'medium',
    note:      'Official Magento/Adobe Commerce site'
  },

  // ── Squarespace (additional) ───────────────────────────────────────────────
  {
    domain:    'sqsp.com',
    expect:    ['squarespace'],
    notExpect: ['wix', 'webflow'],
    minConf:   'medium',
    note:      'Squarespace short domain – CDN signals'
  },

  // ── Ghost (additional) ─────────────────────────────────────────────────────
  {
    domain:    'ghost.io',
    expect:    ['ghost'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'Ghost hosted platform domain'
  },

  // ── Webflow (additional) ───────────────────────────────────────────────────
  {
    domain:    'webflow.io',
    expect:    ['webflow'],
    notExpect: ['wix'],
    minConf:   'medium',
    note:      'Webflow hosted sites domain – CDN signals'
  },

  // ── Wix (additional) ──────────────────────────────────────────────────────
  {
    domain:    'support.wix.com',
    expect:    ['wix'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'Wix support subdomain – parastorage CDN expected'
  },

  // ── Next.js (additional) ───────────────────────────────────────────────────
  {
    domain:    'vercel.com',
    expect:    ['nextjs'],
    notExpect: ['nuxtjs', 'gatsby'],
    minConf:   'medium',
    note:      'Vercel homepage – built with Next.js, __NEXT_DATA__ present'
  },

  // ── Gatsby ─────────────────────────────────────────────────────────────────
  {
    domain:    'gatsbyjs.com',
    expect:    ['gatsby'],
    notExpect: ['nextjs', 'nuxtjs'],
    minConf:   'medium',
    note:      'Official Gatsby site – ___gatsby + /page-data/'
  },

  // ── Hugo ───────────────────────────────────────────────────────────────────
  {
    domain:    'gohugo.io',
    expect:    ['hugo'],
    notExpect: ['wordpress', 'jekyll'],
    minConf:   'medium',
    note:      'Official Hugo site – meta generator tag'
  },

  // ── Jekyll ─────────────────────────────────────────────────────────────────
  {
    domain:    'jekyllrb.com',
    expect:    ['jekyll'],
    notExpect: ['hugo', 'wordpress'],
    minConf:   'medium',
    note:      'Official Jekyll site – meta generator + feed'
  },

  // ── Contentful (additional) ────────────────────────────────────────────────
  {
    domain:    'app.contentful.com',
    expect:    ['contentful'],
    notExpect: ['wordpress'],
    minConf:   'low',
    note:      'Contentful app – ctfassets.net CDN signals'
  },

  // ── Sanity ─────────────────────────────────────────────────────────────────
  {
    domain:    'sanity.io',
    expect:    ['sanity'],
    notExpect: ['contentful', 'storyblok'],
    minConf:   'medium',
    note:      'Official Sanity site – cdn.sanity.io CDN'
  },

  // ── Storyblok ──────────────────────────────────────────────────────────────
  {
    domain:    'storyblok.com',
    expect:    ['storyblok'],
    notExpect: ['contentful'],
    minConf:   'medium',
    note:      'Official Storyblok site – a.storyblok.com CDN'
  },

  // ── Prismic ────────────────────────────────────────────────────────────────
  {
    domain:    'prismic.io',
    expect:    ['prismic'],
    notExpect: ['contentful', 'storyblok'],
    minConf:   'medium',
    note:      'Official Prismic site – cdn.prismic.io CDN'
  },

  // ── Framer (additional) ────────────────────────────────────────────────────
  {
    domain:    'framer.website',
    expect:    ['framer'],
    notExpect: ['webflow'],
    minConf:   'low',
    note:      'Framer hosted sites domain – framerusercontent.com CDN'
  },

  // ── HubSpot CMS (additional) ───────────────────────────────────────────────
  {
    domain:    'blog.hubspot.com',
    expect:    ['hubspotcms'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'HubSpot blog – hs-scripts CDN + hubspotutk cookie'
  },

  // ── Weebly ─────────────────────────────────────────────────────────────────
  {
    domain:    'weebly.com',
    expect:    ['weebly'],
    notExpect: ['wix', 'squarespace'],
    minConf:   'medium',
    note:      'Official Weebly site'
  },

  // ── PrestaShop ─────────────────────────────────────────────────────────────
  {
    domain:    'prestashop.com',
    expect:    ['prestashop'],
    notExpect: ['shopify', 'magento'],
    minConf:   'medium',
    note:      'Official PrestaShop site'
  },

  // ── WoltLab ────────────────────────────────────────────────────────────────
  {
    domain:    'woltlab.com',
    expect:    ['woltlab'],
    notExpect: ['phpbb'],
    minConf:   'high',
    note:      'Official WoltLab site – WCF.Language + /wcf/ paths'
  },

  // ── Craft CMS ──────────────────────────────────────────────────────────────
  {
    domain:    'craftcms.com',
    expect:    ['craftcms'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'Official Craft CMS site – /cpresources/ path'
  },

  // ── Pimcore ────────────────────────────────────────────────────────────────
  {
    domain:    'pimcore.com',
    expect:    ['pimcore'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'Official Pimcore site'
  },

  // ── Symfony ────────────────────────────────────────────────────────────────
  {
    domain:    'symfony.com',
    expect:    ['symfony'],
    notExpect: ['laravel'],
    minConf:   'low',
    note:      'Official Symfony site – sf-toolbar / debug token headers'
  },

  // ── Builder.io ─────────────────────────────────────────────────────────────
  {
    domain:    'builder.io',
    expect:    ['builderio'],
    notExpect: ['contentful'],
    minConf:   'medium',
    note:      'Official Builder.io site – cdn.builder.io CDN'
  },

  // ── Jimdo ──────────────────────────────────────────────────────────────────
  {
    domain:    'jimdo.com',
    expect:    ['jimdo'],
    notExpect: ['wix', 'weebly'],
    minConf:   'high',
    note:      'Official Jimdo site – x-jimdo headers'
  },

  // ── Ghost (self-hosted reference) ─────────────────────────────────────────
  {
    domain:    'openai.com',
    expect:    [],
    notExpect: ['wordpress', 'joomla', 'drupal'],
    minConf:   'low',
    note:      'Custom stack – tests that common CMS are NOT falsely detected'
  },

  // ── False positive guard – major custom-built sites ───────────────────────
  {
    domain:    'github.com',
    expect:    [],
    notExpect: ['wordpress', 'joomla', 'drupal', 'shopify'],
    minConf:   'low',
    note:      'Custom Rails/React stack – no CMS should be detected'
  },
  {
    domain:    'wikipedia.org',
    expect:    [],
    notExpect: ['wordpress', 'drupal', 'joomla'],
    minConf:   'low',
    note:      'MediaWiki – not in signature database, no false positives expected'
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
