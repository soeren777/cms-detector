# TODO – CMS Detector

Development roadmap. Checked items are complete.

---

## v0.9 – Validation ✅

- [x] Expand test corpus to 50+ domains (`test.js`)
- [x] Run `node test.js`, document all failures
- [x] Recalibrate score thresholds based on real results
- [x] Audit CDN patterns for false positives
- [x] Test result: 46/50 (92%)

## v1.0 – Production Ready

- [ ] Verify favicon hashes for Top-10 CMS via real downloads
- [ ] Cloudflare detection as a dedicated channel (warn when results may be masked)
- [ ] 200+ test domains, precision ≥ 90% on Top-20 CMS
- [ ] Version detection tested and refined for all 41 CMS

## Done

- [x] CLI wrapper (`node cli.js example.com`) – default, --json, --quiet modes
- [x] GitHub Actions: run `node test.js` automatically on every push
- [x] Batch mode: read list of domains from CSV

## Nice to have

- [ ] GitHub Actions: run `node test.js` automatically on every push
- [ ] Batch mode: read list of domains from CSV
- [ ] Additional signatures: Adobe Experience Manager, FirstSpirit, Kirby, Statamic
