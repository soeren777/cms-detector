document.addEventListener("DOMContentLoaded", () => {
    const input   = document.getElementById("cmsInput");
    const btn     = document.getElementById("cmsDetectBtn");
    const output  = document.getElementById("cmsDetectionResult");

    // ── SVG Icon Library ────────────────────────────────────────────────
    const SVG = {
        globe:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        zap:      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        target:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
        link:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        download: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
        header:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
        tag:      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
        cookie:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/></svg>`,
        folder:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
        code:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
        search:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
        cpu:      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
        copy:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
        check:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        alert:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        xCircle:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        question: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        chevronDown: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
        chevronUp:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`,
    };

    // ── Styles ──────────────────────────────────────────────────────────
    const style = document.createElement("style");
    style.textContent = `
        #cmsDetectionResult {
            font-family: var(--font-sans);
            background: transparent;
            color: var(--text);
            white-space: normal;
            padding: 0;
            margin-top: 16px;
        }
        .cms-result-wrap { text-align: left; }

        .cms-icon {
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
            color: var(--accent);
        }
        .cms-icon svg { display: block; }

        /* ── Meta-Bar ── */
        .cms-meta-bar {
            display: flex;
            gap: 18px;
            flex-wrap: wrap;
            font-size: 0.78em;
            font-family: var(--font-mono);
            color: var(--muted);
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border);
        }
        .cms-meta-bar span {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: var(--muted);
        }

        /* ── CMS-Karte ── */
        .cms-card {
            background: var(--surface);
            color: var(--text);
            border: 1px solid var(--border);
            border-left: 3px solid var(--border);
            border-radius: var(--radius-md);
            padding: 16px 18px;
            margin-bottom: 10px;
            transition: background .2s, box-shadow .2s;
        }
        .cms-card:hover {
            background: var(--surface2);
            box-shadow: 0 0 0 1px var(--border-hover);
        }
        .cms-card.high   { border-left-color: #4caf50; }
        .cms-card.medium { border-left-color: #ff9800; }
        .cms-card.low    { border-left-color: var(--muted); }

        .cms-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .cms-name {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 1em;
            font-weight: 600;
            font-family: var(--font-mono);
            text-transform: capitalize;
            letter-spacing: .04em;
            color: var(--text);
        }
        .cms-version {
            font-size: 0.72em;
            font-weight: 500;
            font-family: var(--font-mono);
            padding: 1px 7px;
            border-radius: var(--radius-sm);
            background: var(--accent-dim);
            color: var(--accent-bright);
            border: 1px solid rgba(37,117,252,0.2);
            letter-spacing: 0.04em;
            text-transform: none;
        }

        .cms-badge {
            font-size: 0.7em;
            font-family: var(--font-mono);
            font-weight: 600;
            letter-spacing: 0.06em;
            padding: 2px 10px;
            border-radius: 20px;
            border: 1px solid var(--border);
            color: var(--muted);
            background: var(--surface2);
        }
        .cms-badge.high   { color: #4caf50; border-color: rgba(76,175,80,0.35); background: rgba(76,175,80,0.08); }
        .cms-badge.medium { color: #ff9800; border-color: rgba(255,152,0,0.35); background: rgba(255,152,0,0.08); }

        .cms-score-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        .cms-score-bar {
            flex: 1;
            height: 4px;
            background: var(--surface2);
            border-radius: 2px;
            overflow: hidden;
        }
        .cms-score-fill {
            height: 100%;
            border-radius: 2px;
            background: var(--muted);
            transition: width .6s ease;
        }
        .cms-score-fill.high   { background: #4caf50; }
        .cms-score-fill.medium { background: #ff9800; }
        .cms-score-label {
            font-size: 0.75em;
            font-family: var(--font-mono);
            color: var(--muted);
            white-space: nowrap;
        }

        .cms-channels {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            margin-bottom: 10px;
        }
        .cms-channel-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.68em;
            font-family: var(--font-mono);
            padding: 2px 8px;
            border-radius: var(--radius-sm);
            background: var(--accent-dim);
            color: var(--accent-bright);
            border: 1px solid rgba(37,117,252,0.2);
        }
        .cms-channel-tag .cms-icon { color: var(--accent); }

        /* ── Toggle-Button ── */
        .cms-indicators-toggle {
            display: inline-flex !important;
            align-items: center;
            gap: 5px;
            font-size: 0.78em !important;
            font-family: var(--font-mono) !important;
            letter-spacing: 0.02em !important;
            color: var(--accent) !important;
            background: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            cursor: pointer !important;
            transform: none !important;
            box-shadow: none !important;
            transition: color .15s !important;
        }
        .cms-indicators-toggle:hover {
            color: var(--accent-bright) !important;
            background: none !important;
            transform: none !important;
            box-shadow: none !important;
        }
        .cms-indicators-toggle .cms-icon { color: inherit; }

        .cms-indicators-list {
            margin: 8px 0 0 0;
            padding: 10px 14px;
            background: var(--surface2);
            border-radius: var(--radius-sm);
            border: 1px solid var(--border);
            list-style: none;
            font-size: 0.78em;
            font-family: var(--font-mono);
            color: var(--muted);
            display: none;
            line-height: 1.8;
        }
        .cms-indicators-list.open { display: block; }
        .cms-indicators-list li {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .cms-indicators-list li .cms-icon { color: var(--accent); flex-shrink: 0; }

        /* ── Kein Treffer ── */
        .cms-no-result {
            text-align: center;
            padding: 32px 20px;
            color: var(--muted);
            font-family: var(--font-mono);
        }
        .cms-no-result .cms-no-icon {
            display: flex;
            justify-content: center;
            margin-bottom: 14px;
            color: var(--accent);
            opacity: 0.5;
        }
        .cms-no-result p { margin: 6px 0; font-size: 0.9em; }
        .cms-no-result strong { color: var(--text); }

        /* ── Progress ── */
        .cms-progress {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            padding: 28px 0;
            color: var(--muted);
            font-family: var(--font-mono);
        }
        .cms-spinner {
            width: 32px; height: 32px;
            border: 2px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: cms-spin .7s linear infinite;
        }
        @keyframes cms-spin { to { transform: rotate(360deg); } }
        .cms-progress-step {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-size: 0.8em;
            color: var(--muted);
            min-height: 1.4em;
        }
        .cms-progress-step .cms-icon { color: var(--accent); }

        /* ── Copy-Button ──
           Sichtbarkeit über .cms-copy-btn-visible, KEIN display !important
           damit style.display = "none" greift                               */
        .cms-copy-btn {
            display: none;
            margin-top: 12px;
            align-items: center;
            gap: 7px;
            font-family: var(--font-mono) !important;
            font-size: 13px !important;
            letter-spacing: 0.06em !important;
            color: #fff !important;
            background: #6a11cb !important;
            border: none !important;
            border-radius: var(--radius-md) !important;
            cursor: pointer;
            padding: 11px 26px !important;
            transition: background 0.2s, transform 0.2s, box-shadow 0.2s !important;
        }
        .cms-copy-btn.cms-copy-btn-visible {
            display: inline-flex;
        }
        .cms-copy-btn .cms-icon { color: #fff; }
        .cms-copy-btn:hover:not(:disabled) {
            background: #2575fc !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 22px rgba(37,117,252,0.5) !important;
        }
        .cms-copy-btn.copied {
            background: rgba(76,175,80,0.2) !important;
            color: #4caf50 !important;
            transform: none !important;
            box-shadow: none !important;
            border: 1px solid rgba(76,175,80,0.35) !important;
        }
        .cms-copy-btn.copied .cms-icon { color: #4caf50; }

        /* ── Fehler ── */
        .cms-error {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-family: var(--font-mono);
            font-size: 0.85em;
            color: #f44336;
            padding: 12px 0;
        }
        .cms-error .cms-icon { color: #f44336; }
    `;
    document.head.appendChild(style);

    // ── Hilfsfunktionen ──────────────────────────────────────────────────
    function icon(svg) {
        return `<span class="cms-icon">${svg}</span>`;
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showCopyBtn()  { copyBtn.classList.add("cms-copy-btn-visible");    }
    function hideCopyBtn()  { copyBtn.classList.remove("cms-copy-btn-visible"); }

    // ── Copy-Button ──────────────────────────────────────────────────────
    const copyBtn = document.createElement("button");
    copyBtn.className = "cms-copy-btn";
    copyBtn.innerHTML = `${icon(SVG.copy)} Copy to clipboard`;
    output.insertAdjacentElement("afterend", copyBtn);

    copyBtn.addEventListener("click", () => {
        navigator.clipboard
            .writeText(output.innerText)
            .then(() => {
                copyBtn.classList.add("copied");
                copyBtn.innerHTML = `${icon(SVG.check)} Copied!`;
                setTimeout(() => {
                    copyBtn.classList.remove("copied");
                    copyBtn.innerHTML = `${icon(SVG.copy)} Copy to clipboard`;
                }, 2000);
            })
            .catch(() => alert("Copy failed"));
    });

    // ── Progress ─────────────────────────────────────────────────────────
    const progressSteps = [
        { svg: SVG.link,     text: "Resolving DNS & following redirects…"   },
        { svg: SVG.download, text: "Fetching page content…"                 },
        { svg: SVG.header,   text: "Analysing HTTP headers…"                },
        { svg: SVG.cookie,   text: "Checking cookies…"                      },
        { svg: SVG.tag,      text: "Scanning meta tags & HTML attributes…"  },
        { svg: SVG.code,     text: "Parsing script & link tags…"            },
        { svg: SVG.globe,    text: "Checking CDN domain signals…"           },
        { svg: SVG.folder,   text: "Probing CMS-specific paths…"            },
        { svg: SVG.cpu,      text: "Evaluating JS variables…"               },
        { svg: SVG.globe,    text: "Reading robots.txt & sitemap…"          },
        { svg: SVG.search,   text: "Fetching RSS/Atom feed…"                },
        { svg: SVG.zap,      text: "Favicon hash fingerprinting…"           },
        { svg: SVG.xCircle,  text: "Analysing 404 error page…"              },
        { svg: SVG.target,   text: "Calculating confidence scores…"         },
    ];

    function showProgress() {
        const step = progressSteps[0];
        output.innerHTML = `<div class="cms-progress">
            <div class="cms-spinner"></div>
            <div class="cms-progress-step" id="cms-step-label">
                ${icon(step.svg)}${step.text}
            </div>
        </div>`;
        hideCopyBtn();

        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % progressSteps.length;
            const el = document.getElementById("cms-step-label");
            if (el) el.innerHTML = `${icon(progressSteps[i].svg)}${progressSteps[i].text}`;
        }, 900);

        return () => clearInterval(interval);
    }

    // ── Channel-Metadaten ────────────────────────────────────────────────
    const CHANNEL_META = {
        dns:       { label: "DNS / CNAME",    svg: SVG.globe    },
        header:    { label: "HTTP Header",    svg: SVG.header   },
        meta:      { label: "Meta Tag",       svg: SVG.tag      },
        html:      { label: "HTML Pattern",   svg: SVG.code     },
        script:    { label: "Script Tag",     svg: SVG.code     },
        link:      { label: "Link Tag",       svg: SVG.link     },
        cookie:    { label: "Cookie",         svg: SVG.cookie   },
        path:      { label: "Path Probe",     svg: SVG.folder   },
        jsVar:     { label: "JS Variable",    svg: SVG.cpu      },
        cdnSignal: { label: "CDN Domain",     svg: SVG.zap      },
        htmlAttr:  { label: "HTML Attribute", svg: SVG.tag      },
        robots:    { label: "robots.txt",     svg: SVG.globe    },
        favicon:   { label: "Favicon Hash",   svg: SVG.search   },
        feed:      { label: "Feed Generator", svg: SVG.link     },
        errorPage: { label: "404 Fingerprint",svg: SVG.xCircle  },
    };

    // ── Render ───────────────────────────────────────────────────────────
    function renderResults(data) {
        if (data.detectedCMS && data.detectedCMS.length > 0) {
            const maxScore = Math.max(...data.detectedCMS.map(c => data.details[c].score));
            let html = `<div class="cms-result-wrap">`;

            html += `<div class="cms-meta-bar">`;
            if (data.url)          html += `<span>${icon(SVG.globe)} ${escHtml(data.url)}</span>`;
            if (data.responseTime) html += `<span>${icon(SVG.zap)} ${data.responseTime} ms</span>`;
            html += `<span>${icon(SVG.target)} ${data.detectedCMS.length} CMS detected</span>`;
            html += `</div>`;

            data.detectedCMS.forEach((cms, idx) => {
                const conf    = data.confidence[cms];
                const details = data.details[cms];
                const pct     = Math.round((details.score / maxScore) * 100);
                const label   = conf === 'high' ? 'Very likely' : conf === 'medium' ? 'Likely' : 'Possible';

                const channels = (details.channels || []).map(ch => {
                    const m = CHANNEL_META[ch] || { label: ch, svg: SVG.tag };
                    return `<span class="cms-channel-tag">${icon(m.svg)} ${m.label}</span>`;
                }).join('');

                const indicatorId = `cms-ind-${idx}`;
                const toggleId    = `cms-tog-${idx}`;

                const indicators = details.found.map(f =>
                    `<li>${icon(SVG.chevronDown)} ${escHtml(f)}</li>`
                ).join('');

                html += `
                <div class="cms-card ${conf}">
                    <div class="cms-card-header">
                        <span class="cms-name">${escHtml(cms)}${
                            (data.version && data.version[cms.toLowerCase()])
                            ? ` <span class="cms-version">${escHtml(data.version[cms.toLowerCase()])}</span>`
                            : ""
                        }</span>
                        <span class="cms-badge ${conf}">${label}</span>
                    </div>
                    <div class="cms-score-row">
                        <div class="cms-score-bar">
                            <div class="cms-score-fill ${conf}" style="width:${pct}%"></div>
                        </div>
                        <span class="cms-score-label">${details.score} pts</span>
                    </div>
                    ${channels ? `<div class="cms-channels">${channels}</div>` : ''}
                    <button class="cms-indicators-toggle"
                            data-target="${indicatorId}"
                            data-count="${details.found.length}"
                            id="${toggleId}">
                        ${icon(SVG.chevronDown)} Show indicators (${details.found.length})
                    </button>
                    <ul class="cms-indicators-list" id="${indicatorId}">
                        ${indicators}
                    </ul>
                </div>`;
            });

            html += `</div>`;
            output.innerHTML = html;

            // ── Event-Delegation für Toggle-Buttons ──────────────────────
            output.querySelectorAll(".cms-indicators-toggle").forEach(toggleBtn => {
                toggleBtn.addEventListener("click", () => {
                    const listId = toggleBtn.dataset.target;
                    const count  = toggleBtn.dataset.count;
                    const list   = document.getElementById(listId);
                    list.classList.toggle("open");
                    const isOpen = list.classList.contains("open");
                    toggleBtn.innerHTML = isOpen
                        ? `${icon(SVG.chevronUp)} Hide indicators`
                        : `${icon(SVG.chevronDown)} Show indicators (${count})`;
                });
            });

        } else {
            output.innerHTML = `
                <div class="cms-no-result">
                    <div class="cms-no-icon">${SVG.question}</div>
                    <p><strong>No CMS detected</strong></p>
                    <p>The website may use a static HTML setup, a custom-built solution, or an unrecognised CMS.</p>
                    ${data.url ? `<p style="font-size:0.82em;">${escHtml(data.url)}</p>` : ''}
                </div>`;
        }

        showCopyBtn();
    }

    // ── Main click handler ───────────────────────────────────────────────
    btn.addEventListener("click", async () => {
        const value = input.value.trim();
        if (!value) {
            output.innerHTML = `<p class="cms-error">${icon(SVG.alert)} Please enter a domain.</p>`;
            hideCopyBtn();
            return;
        }

        const stopProgress = showProgress();

        try {
            const res  = await fetch(`/api/cms-detect?domain=${encodeURIComponent(value)}`);
            const data = await res.json();
            stopProgress();

            if (data.error) {
                output.innerHTML = `<p class="cms-error">${icon(SVG.xCircle)} Error: ${escHtml(data.error)}</p>`;
                hideCopyBtn();
                return;
            }

            renderResults(data);
        } catch (err) {
            stopProgress();
            output.innerHTML = `<p class="cms-error">${icon(SVG.xCircle)} Network error: ${escHtml(err.message)}</p>`;
            hideCopyBtn();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btn.click();
    });
});
