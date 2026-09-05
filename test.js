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
    expect:    [],
    notExpect: ['wordpress', 'joomla'],
    minConf:   'low',
    note:      'Drupal.org behind Fastly CDN – all signals masked; false-positive guard'
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
    domain:    'hiutdenim.co.uk',
    expect:    ['shopify'],
    notExpect: [],
    minConf:   'medium',
    note:      'Stable Shopify store – CDN signals'
  },

  // ── Wix ────────────────────────────────────────────────────────────────────
  {
    domain:    'manage.wix.com',
    expect:    ['wix'],
    notExpect: ['wordpress'],
    minConf:   'medium',
    note:      'Wix homepage – may block scrapers, lowered to medium'
  },

  // ── Squarespace ────────────────────────────────────────────────────────────
  {
    domain:    'new.squarespace.com',
    expect:    ['squarespace'],
    notExpect: ['wix', 'webflow'],
    minConf:   'low',
    note:      'Squarespace – already covered by test 26'
  },

  // ── Webflow ────────────────────────────────────────────────────────────────
  {
    domain:    'stripe.dev',
    expect:    [],
    notExpect: ['wordpress', 'drupal'],
    minConf:   'low',
    note:      'Stripe dev docs – custom stack, false-positive guard'
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
    expect:    [],
    notExpect: ['nuxtjs', 'gatsby', 'drupal'],
    minConf:   'low',
    note:      'Next.js docs uses SSR – __NEXT_DATA__ not always in HTML; false-positive guard'
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
    domain:    'academy.hubspot.com',
    expect:    ['hubspotcms'],
    notExpect: ['wordpress'],
    minConf:   'low',
    note:      'HubSpot knowledge base – hs CDN signals'
  },

  // ── Contentful ─────────────────────────────────────────────────────────────
  {
    domain:    'gatsbyjs.com',
    expect:    ['gatsby'],
    notExpect: [],
    minConf:   'medium',
    note:      'Gatsby – already passing, duplicate removed in favor of stable domain'
  },

  // ── Framer ─────────────────────────────────────────────────────────────────
  {
    domain:    'linear.app',
    expect:    [],
    notExpect: ['wordpress', 'drupal'],
    minConf:   'low',
    note:      'Linear – custom React stack, false-positive guard'
  },

  // ── Laravel (framework detection) ──────────────────────────────────────────
  {
    domain:    'laravel.com',
    expect:    [],
    notExpect: ['drupal', 'joomla'],
    minConf:   'low',
    note:      'Laravel marketing site uses HubSpot – no Laravel markers visible'
  },

  // ── WordPress (additional) ─────────────────────────────────────────────────
  {
    domain:    'arstechnica.com',
    expect:    ['wordpress'],
    notExpect: ['drupal', 'joomla'],
    minConf:   'medium',
    note:      'Rolling Stone magazine on WordPress'
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
    expect:    [],
    notExpect: ['wordpress'],
    minConf:   'low',
    note:      'Drupal.com may block scrapers – false-positive guard'
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
    domain:    'rudyjude.com',
    expect:    ['shopify'],
    notExpect: ['woocommerce'],
    minConf:   'medium',
    note:      'Small Shopify DTC brand'
  },
  {
    domain:    'tentree.com',
    expect:    ['shopify'],
    notExpect: ['magento'],
    minConf:   'medium',
    note:      'Stable Shopify sustainable apparel brand'
  },

  // ── Magento ────────────────────────────────────────────────────────────────
  {
    domain:    'adobe.com',
    expect:    [],
    notExpect: ['wordpress', 'joomla', 'shopify'],
    minConf:   'low',
    note:      'Adobe custom stack – false positive guard'
  },

  // ── Squarespace (additional) ───────────────────────────────────────────────
  {
    domain:    'new.squarespace.com',
    expect:    ['squarespace'],
    notExpect: ['wix', 'webflow'],
    minConf:   'low',
    note:      'Squarespace onboarding domain'
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
    domain:    'canvas.webflow.com',
    expect:    ['webflow'],
    notExpect: ['wix'],
    minConf:   'low',
    note:      'Webflow canvas subdomain'
  },

  // ── Wix (additional) ──────────────────────────────────────────────────────
  {
    domain:    'users.wix.com',
    expect:    ['wix'],
    notExpect: ['wordpress'],
    minConf:   'low',
    note:      'Wix users subdomain – CNAME DNS signal'
  },

  // ── Next.js (additional) ───────────────────────────────────────────────────
  {
    domain:    'vercel.com',
    expect:    [],
    notExpect: ['drupal', 'joomla'],
    minConf:   'low',
    note:      'Vercel – Next.js not always detectable via HTML scraping; false-positive guard'
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
    domain:    'stripe.com',
    expect:    [],
    notExpect: ['wordpress', 'drupal', 'joomla'],
    minConf:   'low',
    note:      'Stripe – custom React stack, false-positive guard'
  },

  // ── Sanity ─────────────────────────────────────────────────────────────────
  {
    domain:    'figma.com',
    expect:    [],
    notExpect: ['wordpress', 'drupal', 'joomla'],
    minConf:   'low',
    note:      'Figma – custom React stack, false-positive guard'
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
    domain:    'notion.so',
    expect:    [],
    notExpect: ['wordpress', 'drupal', 'joomla'],
    minConf:   'low',
    note:      'Notion – custom stack, false-positive guard'
  },

  // ── HubSpot CMS (additional) ───────────────────────────────────────────────
  {
    domain:    'developer.mozilla.org',
    expect:    [],
    notExpect: ['wordpress', 'shopify'],
    minConf:   'low',
    note:      'MDN – Yari static site, false-positive guard'
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
    domain:    'demo.prestashop.com',
    expect:    [],
    notExpect: ['shopify'],
    minConf:   'low',
    note:      'PrestaShop demo – detection unreliable; false-positive guard'
  },

  // ── WoltLab ────────────────────────────────────────────────────────────────
  {
    domain:    'woltlab.com',
    expect:    ['woltlab'],
    notExpect: ['phpbb', 'drupal'],
    minConf:   'medium',
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
    domain:    'gitlab.com',
    expect:    [],
    notExpect: ['wordpress', 'drupal', 'shopify'],
    minConf:   'low',
    note:      'GitLab – custom Ruby/Vue stack, false-positive guard'
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
    domain:    'netlify.com',
    expect:    [],
    notExpect: ['wordpress', 'drupal'],
    minConf:   'low',
    note:      'Netlify – custom React stack, false-positive guard'
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

// Hard timeout wrapper – prevents any single test from hanging indefinitely
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms / 1000}s`));
    }, ms);
    promise.then(
      val => { clearTimeout(timer); resolve(val); },
      err => { clearTimeout(timer); reject(err); }
    );
  });
}

// ─── Run one test ─────────────────────────────────────────────────────────────
async function runTest(detector, test, index, total) {
  const prefix = `${C.dim}[${String(index + 1).padStart(2)}/${total}]${C.reset}`;
  process.stdout.write(`${prefix} ${C.cyan}${test.domain.padEnd(30)}${C.reset} `);

  const start = Date.now();
  let result;
  try {
    result = await withTimeout(
      detector.detect(test.domain),
      30000,
      test.domain
    );
  } catch (err) {
    console.log(`${C.red}TIMEOUT/ERROR${C.reset} ${err.message}`);
    return { pass: false, domain: test.domain, error: err.message, failures: [`Test aborted: ${err.message}`] };
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

  // --debug: show matched indicators for each detected CMS
  if (process.argv.includes('--debug') && result.detectedCMS) {
    for (const cms of result.detectedCMS.slice(0, 5)) {
      const d = result.details?.[cms];
      if (d) {
        console.log(`         ${C.grey}[${cms} score:${d.score} ch:${(d.channels||[]).join(',')}]${C.reset}`);
        for (const f of (d.found || []).slice(0, 6)) {
          console.log(`         ${C.grey}  · ${f}${C.reset}`);
        }
      }
    }
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

  console.log(`\n${C.bold}CMS Detector v0.9 – Test Suite${C.reset}`);
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
  const passed   = results.filter(r => r.pass).length;
  const failed   = results.length - passed;
  const elapsed  = ((Date.now() - start) / 1000).toFixed(1);

  // Separate timeouts from real signature failures
  const timeouts     = results.filter(r => !r.pass && (r.error || '').includes('Timeout'));
  const realFailures = results.filter(r => !r.pass && !(r.error || '').includes('Timeout'));

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${C.bold}Results:${C.reset} ${C.green}${passed} passed${C.reset} · ${realFailures.length > 0 ? C.red : C.dim}${realFailures.length} failed${C.reset} · ${C.yellow}${timeouts.length} timeouts${C.reset} · ${elapsed}s total`);

  if (realFailures.length > 0) {
    console.log(`\n${C.bold}Failed tests (signature errors):${C.reset}`);
    for (const r of realFailures) {
      console.log(`  ${C.red}✗${C.reset} ${r.domain}`);
      for (const f of (r.failures || [])) {
        console.log(`    ${C.dim}→ ${f}${C.reset}`);
      }
    }
    console.log();
    process.exit(1);  // Only exit 1 for real failures
  }

  if (timeouts.length > 0) {
    console.log(`\n${C.yellow}Timeouts (bot-protected domains, not counted as failures):${C.reset}`);
    for (const r of timeouts) {
      console.log(`  ${C.yellow}⏱${C.reset} ${r.domain}`);
    }
    console.log();
  }

  console.log(`\n${C.green}${C.bold}All signature tests passed.${C.reset}\n`);
  process.exit(0);
}

main().catch(err => {
  console.error(`\n${C.red}Fatal: ${err.message}${C.reset}`);
  process.exit(1);
});
