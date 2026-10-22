---
target: Dashboard
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\M S I\\Downloads\\portfolio-deni\\src\\pages\\Dashboard.tsx"
target_fingerprint: "sha256:cce8916c88686857430af3bdf9a2fcf712f490ba07282fe06bf40cad76e93f0e"
target_path: "C:\\Users\\M S I\\Downloads\\portfolio-deni\\src\\pages\\Dashboard.tsx"
timestamp: 2026-09-28T01-09-45Z
slug: src-pages-dashboard-tsx
closed: true
---
# Design Critique — Dashboard

**Target:** `src/pages/Dashboard.tsx` · **Slug:** `src-pages-dashboard-tsx` · **Platform:** web
**Method:** dual-agent (A: sa-0-176acd79 · B: sa-0-17404d08)

**Scope note:** Assessment A (design review, live screenshots 1440/390) and Assessment B (detector + CDP browser evidence at 1440/390/820) ran isolated. Previous Sept-27 snapshot was treated as stale; this assesses current code fresh.

## Design Health Score

Mode: Experience (portfolio). H7 n/a (read-mostly surface, nothing to accelerate). H10 n/a (static surface; chat assistant is the help layer, outside this file).

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton/stale/as-of/refresh overlay good; per-second clock tick is noise |
| 2 | Match System / Real World | 3 | Plain short copy; "Streak" lacks its unit (days) |
| 3 | User Control and Freedom | 3 | Esc/click-outside/scroll-restore on modal; no focus trap/return |
| 4 | Consistency and Standards | 2 | Dead "What's this?" affordance; dialog without focus management |
| 5 | Error Prevention | 3 | Strict cache validation, AbortController+15s timeout, no zero-claim |
| 6 | Recognition Rather Than Recall | 2 | Roving grid labels good; "What's this?" promises help that doesn't exist |
| 7 | Flexibility and Efficiency | n/a | Read-mostly Experience surface |
| 8 | Aesthetic and Minimalist Design | 2 | Clocks 35px/27px rival 47px hero name; ~130-word hero block |
| 9 | Error Recovery | 3 | Plain error copy + profile fallback; no retry control |
| 10 | Help and Documentation | n/a | Assistant is the help layer, outside this file |
| **Total** | | **21/32 (66%)** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** authored for this product, not interchangeable — but under-edited. Engine-Room system genuinely present (one family, Ink default accent, 2px day-cell radius, hairline separation, flat-by-default). GitHub card engineering is product-specific craft (verified total, strict cache validation, tracked all-time streak JSON, memo'd count-up, single portal tooltip, viewport-gated fetch). Editorial dilutes it: differentiators (GIS/geospatial, government agencies, "up to 40%") sit mid-paragraph in a ~130-word hero while display-scale is spent on two clocks. Fixed since last snapshot (verified in source): availability CTA is now real `mailto:` (NowCard :626), calendar uses roving tabindex with one grid stop (:1100–1270), hero carries `Bandung, Indonesia · GMT+7` (:306) with CTA relabeled Email (:357–363).

**Deterministic scan:** `detect --json src/pages/Dashboard.tsx` → exit 0, `[]` (0 findings in the target). `detect --json src` → exit 2, **169 findings, all in `src/styles.css`, 0 in Dashboard.tsx**: 93× design-system-color/advisory, 68× design-system-font-size/advisory, 2× design-system-radius/advisory, 1× codex-grid-background/advisory (:301), 2× side-tab/warning (:2630, :2672 `border-left: 3px solid var(--accent)`), 2× bounce-easing/warning (:2974, :3626 `cubic-bezier(0.34,1.56,0.64,1)` — the documented `--ease-spring`, intentionally kept per No-New-Spring rule), 1× layout-transition/warning (:4749 `transition: max-height`). The 161 advisory hits read as noise against a stale DESIGN.md ramp; the 5 warnings are global-CSS attribution unconfirmed to this surface.

**Browser evidence (preview 200, CDP):** console 0 errors (only 2× info "mirror fallback"); page-level horizontal overflow none (390=390, 1430/1440, 810/820); GitHub card loads 53 weeks/371 days at all widths (skeleton in instant captures is a timing artifact); state-motion bound (`.github-content` → state-in 0.22s, `.github-stats strong` → stat-ack 0.3s; `.github-error` unmounted as load succeeded); calendar geometry scales (cell 16.8px @1440, 8.6px @390 with internal auto-scroll wrap 334, 5.8px @820); hero CTAs 39px tall @desktop/820 (below 44px) but 338×44 stacked @390 (pass).

## Overall Impression

The engine room is real — honest states, load-bearing performance, token discipline — but the first viewport argues "developer with clocks" instead of "the developer who maps government data." Biggest opportunity: make the hero lead with proof and demote the clocks to footnote.

## What's Working

1. **GitHub card state machine** (loading / cached+stale / fresh / error+fallback / debounced refresh overlay) with copy that never invents numbers — the most mature code on the site.
2. **Performance architecture is load-bearing:** Dashboard direct-imported while other routes lazy, fetch gated on viewport intersection, count-up isolated in memos, one portal tooltip instead of ~370.
3. **Token discipline holds across captures:** one typeface, hairline separation, accent confined to live/interactive elements, dark-mode counterparts present.

## Priority Issues

- **[P1] "What's this?" in NowCard (:612) is a bare span — looks like help, does nothing.** Why it matters: false affordance punishing exactly the users who seek guidance. Fix: wire as a real popover explaining availability status, or delete the span. Suggested command: `/impeccable clarify`.
- **[P1] Resume modal (:391–456) has role=dialog + aria-modal but no focus trap, no initial focus, no return-focus.** Why it matters: breaks the modal contract; keyboard users tab behind it while the rest of the site (roving grid) is genuinely keyboard-good. Fix: trap Tab, autofocus close on open, return focus on close. Suggested command: `/impeccable harden`.
- **[P1] Hero CTAs render 39px tall on desktop/tablet (CDP: 109.4×39 … 107.1×39), below the 44px touch floor.** Why it matters: primary conversion buttons (LinkedIn/GitHub/Email/Resume) fail the touch target the site enforces elsewhere; mobile stacks pass (338×44) so this is desktop-only. Fix: raise `.hero-actions .button` min-height to 44px (zero geometry philosophy conflict — this is the control itself, not an overlay case). Suggested command: `/impeccable polish`.
- **[P2] Dual clocks outweigh evidence and duplicate for WIB visitors.** Why it matters: 35px/27px numerals rival the hero name; local recruiters see the same time twice, reading as broken (prior YOUR TIME/Asia-Jakarta bug context). Fix: when visitor offset equals GMT+7, collapse YOUR TIME into a "same as yours" note; consider stepping clocks to 24px headline size. Suggested command: `/impeccable layout`.
- **[P2] Hero paragraph is one ~130-word block; differentiator (GIS, government, 40%) is sentence four of five.** Why it matters: violates PRODUCT.md #1/#3 (evidence first, skimmable in 30s). Fix: cut to two sentences leading with GIS + public-sector proof + 40%; move tool list to Tech Stack. Suggested command: `/impeccable clarify`.
- **[P3] Touch tooltip has onTouchStart with no dismiss path (:1065–1070; pointer-events:none portal).** Why it matters: on phones the bubble lingers until another tap. Fix: dismiss on touchend/pointerleave or second tap. Suggested command: `/impeccable polish`.

## Persona Red Flags

- **Jordan (first-timer from LinkedIn):** differentiator arrives sentence four; "Streak" without "days" and GitHub-literate heatmap exclude non-developers; dead "What's this?" strands the help-seeker. 30-second read yields "developer with clocks," not "GIS + government + 40%."
- **Casey (distracted mobile 390px):** correct stacking, wrong priority — 4 CTAs + 2 clocks + status + loading graph precede proof; CDP numbers clear it of page-level overflow (390=390, button edge 364<390) despite a blurred-crop vision claim of clipping — numbers win, but priority order still buries evidence.
- **Sam (keyboard/screen-reader):** roving grid genuinely good (371 stops → 1, arrows/Home/End, full labels); red flags are untrapped modal, non-focusable "What's this?", cryptic "24H" toggle label out of context.
- **Recruiter-as-Jordan:** location line now present (old silent-skip fixed); remaining gaps: contract/remote/start-date unanswered, GIS edge needs two more clicks to Experience.

## Minor Observations

- "2+ year" should read "2+ years".
- Animated heading renders "N contributions" lowercase mid-sentence.
- Footer link swaps label+destination across states (docs vs profile) — honest but unsteady label.
- `time-zone` class on 12/24H toggle misnames its function.
- ID dictionary concatenates "Currently open to" + "full-time roles" instead of translating the phrase.
- PDF iframe has no fallback text (adjacent download link makes this acceptable).
- Week-in stagger (~53×12ms) should confirm reduced-motion coverage.
- Detector `bounce-easing` hits are the documented `--ease-spring` (No-New-Spring rule: intentionally kept, not a fix item).
- Detector `side-tab` hits (:2630, :2672) unconfirmed to Dashboard surface — verify ownership before touching.

## Questions to Consider

- What if the first viewport argued one thing — "the developer who maps government data" — and the clocks were a footnote?
- What would this page look like if the WIB visitor (the majority) never saw a second clock?
- Is the contribution graph evidence a recruiter can use, or craft a developer admires — and should those have different placements?
