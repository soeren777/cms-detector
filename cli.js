#!/usr/bin/env node
// cli.js – CMS Detector command-line interface
// Usage: node cli.js example.com
//        node cli.js example.com --json
//        node cli.js example.com --quiet

'use strict';

const CMSDetector = require('./cms-detector');

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
  red:    '\x1b[31m',
};

const args   = process.argv.slice(2);
const domain = args.find(a => !a.startsWith('--'));
const json   = args.includes('--json');
const quiet  = args.includes('--quiet');

if (!domain) {
  console.error(`Usage: node cli.js <domain> [--json] [--quiet]`);
  console.error(`       node cli.js example.com`);
  process.exit(1);
}

(async () => {
  if (!quiet && !json) {
    process.stdout.write(`${C.dim}Analysing ${domain}...${C.reset}\n`);
  }

  const detector = new CMSDetector();
  const result   = await detector.detect(domain);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.error ? 1 : 0);
  }

  if (result.error) {
    console.error(`${C.red}Error: ${result.error}${C.reset}`);
    process.exit(1);
  }

  if (!result.detectedCMS || result.detectedCMS.length === 0) {
    if (!quiet) console.log(`${C.dim}No CMS detected${C.reset}`);
    process.exit(0);
  }

  if (quiet) {
    // One line per CMS: name confidence [version]
    for (const cms of result.detectedCMS) {
      const ver  = result.version?.[cms] ? ` v${result.version[cms]}` : '';
      console.log(`${cms}${ver} (${result.confidence[cms]})`);
    }
    process.exit(0);
  }

  // Full output
  console.log(`\n${C.bold}${domain}${C.reset}  ${C.grey}${result.responseTime}ms${C.reset}\n`);

  for (const cms of result.detectedCMS) {
    const conf    = result.confidence[cms];
    const details = result.details[cms];
    const ver     = result.version?.[cms] ? `${C.grey} v${result.version[cms]}${C.reset}` : '';
    const confCol = conf === 'high' ? C.green : conf === 'medium' ? C.yellow : C.dim;
    const badge   = conf === 'high' ? 'Very likely' : conf === 'medium' ? 'Likely' : 'Possible';

    console.log(`  ${C.bold}${cms}${C.reset}${ver}  ${confCol}${badge}${C.reset}  ${C.grey}${details.score} pts  [${(details.channels||[]).join(', ')}]${C.reset}`);
  }

  console.log();
})();
