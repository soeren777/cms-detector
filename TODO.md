# TODO – CMS Detector

Development roadmap. Checked items are complete.

---

## v0.9 – Validation

- [ ] Expand test corpus to 50+ domains (`test.js`)
- [ ] Run `node test.js`, document all failures
- [ ] Recalibrate score thresholds based on real results
- [ ] Verify favicon hashes for Top-10 CMS via real downloads
- [ ] Audit CDN patterns for false positives (especially Netlify/Vercel)

## v1.0 – Production Ready

- [ ] 200+ test domains, precision ≥ 90% on Top-20 CMS
- [ ] Test and refine version detection for all 41 CMS
- [ ] In-memory cache for bulk scans (5 min TTL per domain)
- [ ] Negative indicators for all CMS pairs that are frequently confused

## Mid-term

- [ ] Evaluate Option 7 (TLS fingerprinting) once other channels are stable
- [ ] Open GitHub Issues for community contributions
- [ ] Additional signatures: Adobe Experience Manager, FirstSpirit, Kirby, Statamic
- [ ] Cloudflare detection as a dedicated channel (warn when results may be masked)

## Nice to have

- [ ] CLI wrapper (`node cms-detector.js example.com`) for direct use without API
- [ ] Batch mode: read list of domains from CSV
- [ ] GitHub Actions: run `node test.js` automatically on every push
