---
target: Dashboard (src/pages/Dashboard.tsx)
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\M S I\\Downloads\\portfolio-deni\\src\\pages\\Dashboard.tsx"
target_fingerprint: "sha256:db45c2ae1e5ef8312a24ae8b73c9ccfecddd97ffe4f8afc4e34ec4238a8ddcd2"
target_path: "C:\\Users\\M S I\\Downloads\\portfolio-deni\\src\\pages\\Dashboard.tsx"
timestamp: 2026-09-27T18-32-45Z
slug: src-pages-dashboard-tsx
---
# Design Critique — Dashboard

**Target:** `src/pages/Dashboard.tsx` · **Slug:** `src-pages-dashboard-tsx` · **Platform:** web
**Method:** dual-agent (A: sa-0-5ad0febb · B: sa-1-159417a8)

**Scope note:** both assessments ran in isolated sub-agents as required. Every P0/P1
claim below was independently re-verified against the current source by the parent
before being reported as fact (line references given). Sub-agent findings that could
not be reproduced were demoted to "verify", not reported as defects.

---

## Design Health Score

Mode: **Experience** (portfolio — let the artifact lead). Heuristics 7 (Flexibility
and Efficiency) and 10 (Help and Documentation) are scored `n/a` per the
mode-applicability rule: this is a read-mostly portfolio with no long forms, no data
tables, no multi-step flows, and no task that benefits from accelerators or a docs
layer. The in-page assistant is the live help surface and it works.

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading / cached / stale / refresh states are genuinely well-built. The "Showing cached contributions" footer swap is a class-one touch. Minor: the refresh overlay has no accessible label. |
| 2 | Match System / Real World | 2 | "MY TIME" / "YOUR TIME" / "Now" / "Total" / "Resume" / "Gmail" / "12H" — seven labels, four capitalization conventions in one viewport. "Gmail" is a brand name where the user needs a verb. |
| 3 | User Control and Freedom | 3 | Theme, 6 accents, 12H/24H, language all reversible and persisted. Escape and click-outside close the resume modal; scroll position restores. |
| 4 | Consistency and Standards | 2 | Internally exemplary. Externally: the resume modal has `role="dialog"` + `aria-modal` but **no focus trap** — `document.activeElement` is `BODY` while it is open. |
| 5 | Error Prevention | 2 | Defensive throughout, but the page's single explicit recruitment-intent link is inert (see P0-1). |
| 6 | Recognition Rather Than Recall | 3 | Every icon is paired with text; nothing is icon-only. Costs recognition speed by putting chrome ahead of evidence. |
| 7 | Flexibility and Efficiency | n/a | Read-mostly portfolio: no forms, tables, or multi-step flow to accelerate. |
| 8 | Aesthetic and Minimalist Design | 3 | The system's real arena, and largely won: monochrome default, one family, one motion language, flat-by-default. Deduct for a verbose loading state and the error state that still asserts numbers. |
| 9 | Error Recovery | 2 | Error copy is plain and offers a real fallback link, but the header keeps claiming data while the body says it failed (see P0-2). |
| 10 | Help and Documentation | n/a | Static portfolio; the assistant is the live help surface. |
| **Total** | | **22/32 (69%)** | **Acceptable** |

Renormalized to the 8 applicable heuristics. 22/32 = 69% → *Acceptable* band, close to
the *Good* boundary. A fair reading: the system is well-built and the two blocking
defects are not visual ones.

---

## Design Specificity Verdict

**Authored, and more than usually so — but not yet edited.**

The "Engine Room" language is genuinely present, not asserted: the 47px/−2.3px display
belongs to the hero name alone, contribution level 4 is the accent token, the 2px
radius belongs to the data cell and nothing else, one font at five weights, one
0.28s motion curve, one shadow vocabulary. An unrelated product could not wear this
unchanged.

What undercuts it is prioritization. The hero card is a generic white plate carrying a
611-character paragraph in which four of five sentences are a CV laundry list. Three
of four elements in the right column (`MY TIME`, `YOUR TIME`, `Now`) are personal
dashboard chrome, not qualification evidence. The contribution calendar is literal
GitHub data rather than something instrumented. The genuinely differentiating work —
GIS, government clients, a 40% efficiency improvement — is real, traceable to
`src/data.ts`, and buried in sentence four.

The result reads as density used to fill rather than density used to filter. A
30-second recruiter spends their peak attention on two clocks and a heatmap that
takes three seconds to decode, while the proof that separates this candidate from
every other full-stack applicant sits mid-paragraph.

**Deterministic scan:** 169 findings across `src`, **all** in `src/styles.css`, **zero**
in any `.tsx`. Breakdown: design-system-color 93, design-system-font-size 68, side-tab
2, bounce-easing 2, design-system-radius 2, layout-transition 1, codex-grid-background
1 (164 advisory, 5 warning). The 5 warnings: `src/styles.css:2623`, `:2665` (side-tab
`border-left: 3px solid var(--accent)`), `:2967`, `:3602` (bounce-easing — the
`--ease-spring` already documented as fidelity, not a pattern), `:4725`
(`transition: max-height`).

**Two harness findings worth recording, because both would have produced a false pass:**

1. **The detector's exit code is useless as a signal.** Its contract is 0 = clean,
   2 = findings. `detect --json src` returned 169 findings *and exit 0*. All four
   invocations exited 0. Reading exit code as "clean" would have silently passed a
   dirty tree.
2. **Bare `detect --json` with no path is a no-op.** At the repo root it returned `[]`
   despite those 169 findings living under `src`. A scan without an explicit target
   path reports a clean tree that does not exist.

Also: a `low-contrast` finding on `.lang-toggle-btn.active` is a false positive — the
button's own background is transparent and its contrast walker only climbs ancestors,
while the real backdrop is the absolutely-positioned `.lang-toggle-pill` sibling. The
button is 100% covered by that pill (both 44×23 at identical coordinates), so black
on white is ~21:1, not the reported 1.0.

**Browser evidence:** 0 console errors, 0 warnings, 0 uncaught exceptions, 0 failed
requests at 1440×1000 and 390×844. No horizontal overflow at either width. The
560px calendar inside a 332px `overflow-x: auto` wrapper is a deliberate scroller, not
a layout leak; nothing is silently clipped. The native browser tool timed out at 420s
twice, including against an external control URL, so all measurements came from raw
CDP against headless Chrome. The page was proven non-blank deterministically (DIV#root
with 2 children, h1 "Deni Purwanto", 68973-byte screenshot with 256 distinct byte
values) — an explicit check, because a previous harness in this session measured an
unmounted page and reported a clean run.

**Visual overlays:** no user-visible overlay was produced. Script-injection preflight
passed, so a live overlay was possible in principle, but no live server was kept up
for presentation, and nothing here should be read as "open the browser and look at
highlighted issues."

---

## Overall Impression

The system is real and consistently applied — that is the achievement. The problem is
editorial: this page has a point of view about craft and no point of view about
*argument*. It shows clocks and a heatmap at display-adjacent scale and files the one
sentence a competitor cannot copy into the middle of a paragraph.

Biggest single opportunity: **decide what the first viewport is arguing.** Everything
else follows from that.

---

## What's Working

**Token-level coherence, not mockup-level.** One font, one radius ladder, one motion
curve, one shadow vocabulary, verified consistent down to the CSS variables. This is
language, not a template with a colour scheme swapped.

**The GitHub card's state machine is the most mature code on the site.** Five distinct
states — loading skeleton, cached-with-stale-badge, fresh, error-with-fallback-link,
refresh-overlay-with-debounce — each with honest copy that does not overclaim. Cache
is read synchronously at mount so it paints instantly. Strict cache validation rejects
a count arriving as a string. Timeout, AbortController, and a separate tracked
all-time streak record so the record cannot silently decay when the 365-day window
shifts. This is defensive engineering born of real production bugs, and it is the one
card that treats the visitor as someone who might be on a bad network.

**Performance architecture is load-bearing.** Dashboard is a direct import while every
other route is `lazy()`. The GitHub fetch is gated on the card entering the viewport
with a 2.5s fallback, so it does not compete with the LCP image. Count-up lives in
three small memo'd components. The tooltip portals as one bubble rather than 371. The
font loads async and the LCP image is preloaded.

---

## Priority Issues

### **[P0] "full-time roles" is an inert link — and it is the page's only recruitment CTA**

*Verified at `src/pages/Dashboard.tsx:613-618`:* `<a href="#" onClick={(e) =>
e.preventDefault()}>`. No navigation, no state change, no feedback.

**Why it matters:** PRODUCT.md's product purpose is turning a short visit into a
contact attempt. This is the one line on the Dashboard that states availability
("Currently open to full-time roles"). A recruiter who reads the signal and clicks —
the exact moment of intent — gets nothing. The conversion path is missing at its own
most-likely tap point.

**Fix:** the destination should be contact, not navigation. PRODUCT.md principle #2
is "Contact is the destination." A `mailto:` link is one line, zero plumbing, no
component refactor:
`mailto:denipurwanto800@gmail.com?subject=Full-time%20role%20enquiry`.
If in-page navigation is preferred instead, the Dashboard child has no access to the
router's `goTo`, so it needs a small custom-event bridge — strictly more machinery
for the same outcome. Also note the Indonesian variant is a concatenated string
("Currently open to" + "full-time roles") with no matching dictionary entry, so it
does not translate as a phrase.

**Suggested command:** `/impeccable polish`

---

### **[P0] The header asserts "0 contributions" while the body says the load failed**

*Verified at `src/pages/Dashboard.tsx:1490`:* `const displayTotal = total ?? 0`, feeding
`AnimatedTotalHeading` / `AnimatedTotalStat` / `AnimatedStreakStat`. Those components
render `—` **only while `loading` is true** (`:1215`, `:1233`); once loading flips
false on the error path (`:1346`, `:1464`) with `total` still `null`, they render a
literal `0`. The error banner at `:1651` then renders "Unable to load GitHub
contributions." directly beneath three zeros.

**Why it matters:** `0` is not an absence — it is a false data claim, and this page's
first constraint is "no invented numbers; every statistic traces to data." The
recruiter reads "zero contributions" and infers no activity at all, rather than "the
network blinked." This is the single worst thing the page can say about someone, and
it says it during a transient failure.

**Fix:** add an explicit `unavailable` state. Pass `error` into the three animated
components and render `—` when the fetch failed with no cached data, rather than
gating the dash on `loading` alone. Add a third footer state: alongside "Showing
cached contributions" and "Learn how we count contributions," there should be "Could
not reach GitHub," keeping the profile link.

**Suggested command:** `/impeccable polish`

---

### **[P1] The 371-cell calendar consumes 93% of the page's tab stops**

*Verified at `src/pages/Dashboard.tsx:1024-1028`:* every day cell renders `tabIndex={0}`
with `role="img"` and a full `aria-label` ("23 contributions on Sep 16, 2025").

**Why it matters:** the per-cell labels are genuinely good, and that is exactly the
problem — every one of them is an individual keyboard stop. Reaching Contact from the
Dashboard requires 371 presses. Technically compliant, practically hostile.

**Fix:** one tab stop for the grid, arrow-key navigation inside it. Container gets
`role="grid"` + `tabIndex={0}`; cells get `tabIndex={-1}` with a roving tabindex
(±1 on Left/Right, ±7 on Up/Down, Home/End) in a single `keydown` handler. The public
`aria-label` per cell is kept; only the per-cell *stop* goes away. A blanket
`tabIndex={-1}` without arrow keys is the wrong fix — it would remove keyboard access
to the data entirely, which is worse than the current state.

**Suggested command:** `/impeccable polish`

---

### **[P1] My own touch-target fix does not work on the accent swatches**

*Verified at `src/styles.css:588`:* `.accent-swatch` carries `overflow: hidden` — added
long ago to clip the `::before` Default gradient to the circle. The `::after` 44px hit
overlay I added in the last commit (`src/styles.css:9646-9663`) is centred on the
22px swatch, so 11px of it on every side lies outside the padding box and is clipped
away. The swatch's real target is ~26×26, not 44×44.

**Why it matters:** this is the one control the visitor is most likely to reach for on
a phone, and it is the one that got the smallest effective area. The 8px gaps between
swatches resolve to `.accent-picker`, a plain `div` with no `tabindex` and no handler —
tapping the gap does nothing at all. Every other target in that same block
(`.nav-item`, `.mobile-header-menu`, `.lang-toggle-btn`) was verified working by
real hit-testing, so this is an isolated defect, not a broken approach.

**Fix:** the overlay must live on a wrapper that is not clipped, not on the swatch
itself. Move the `::after` to `.accent-swatches > *` (or a per-swatch wrapper element)
and keep `overflow: hidden` on `.accent-swatch` for the gradient. Mind the spacing:
centres are 30px apart (22px swatch + 8px gap), so a 44px zone overlaps its neighbour
by 14px. Either reduce the overlay to 30px so each target lands exactly in its own
cell, or increase the gap to 22px so 44px zones sit side by side without overlap.
Overlap is worse than a small target — it means a tap can activate the wrong theme.

**Suggested command:** `/impeccable polish`

---

### **[P2] The right column outweighs the evidence, and one CTA is labelled with a brand**

Hero CTA order is LinkedIn → GitHub → Gmail → Resume, so the two actions that convert
sit third and fourth. "Gmail" is a brand name where a recruiter needs a verb; the
address is not visible. Meanwhile `MY TIME` renders at 37px against a 47px hero name —
optically near-equal weight for a clock.

**Fix (copy-first, zero geometry):** `Gmail` → `Email`. One string, no CSS, and it
respects "The Geometry Is Not Yours Rule" automatically. If the weight change is
wanted separately, lower the clock to the 24px headline step — but that is a
typographic decision and should be argued on its own, not bundled.

**Suggested command:** `/impeccable polish`

---

## Persona Red Flags

**Jordan — the first-timer, arriving from LinkedIn with 30 seconds.** The
positioning that matters ("full-stack developer in Bandung working on GIS and
government systems") surfaces in sentence three or four of a 611-character paragraph.
Dark mode is the likely default via OS preference, and contrast is healthy throughout
(11.6:1 body, 21:1 stats). The structural problem is that the first viewport ends with
a pair of clocks and a heatmap a non-developer cannot decode, and the differentiator is
mid-paragraph.

**Casey — on a phone, one-handed, 390×844.** The GitHub card starts at y=1038, so
reaching it means scrolling past roughly 700px of time card and now card first. The
hero paragraph runs 13 lines on mobile — about 298px of scroll for text that is 78%
generic skill-list. The calendar needs horizontal scrolling (576px of content in a
332px wrapper) with no visual affordance that it scrolls at all, and its day cells are
8.6px targets — 24px is the WCAG 2.2 floor, 44px the platform guidance. The 24H toggle
is 38×22px. The accent swatches are ~26px effective (P1 above). The tooltip opens on
touch and has no touch-end or pointer-leave handler, so it does not dismiss.

**Recruiter "Rina" — 30-second scan, agency filter, needs a location.** Location is
absent from the page entirely; "Bandung" appears in PRODUCT.md but never on the
Dashboard. For Indonesian agency and HR screening, location is a primary filter — its
absence is a silent skip. Availability exists but is buried under a 37px clock.
Contract type, remote status, and availability start are all unanswered. The GIS and
public-sector differentiator that PRODUCT.md calls out as the main edge requires
navigating to the Experience page — two clicks, which a 30-second scan will not do.
Smallest high-value fix in the whole critique: a single `Bandung, Indonesia · GMT+7`
line in the hero.

---

## Minor Observations

- **"What's this?"** in the Now card is styled as a link — underlined, pointer cursor
  — but has no click handler, no focusability, and no `title`. It is decoration wearing
  an affordance it does not honour.
- **"Streak" is ambiguous.** The header shows 12 (all-time longest, from a tracked
  JSON) while the calendar beneath shows a current run of 0. Two numbers, same word.
  The tooltip explains it on hover, which mobile never gets.
- **"2+ year of experience"** — should be "years". It is live text in
  `src/manualTranslations.ts` as well, so both need to change together.
- **Residual English in ID mode:** "Resume", "Gmail", "Streak", "12H"/"24H", and the
  loading/error status strings have no dictionary entries. The loading copy
  (`Loading GitHub contributions...`) and the error copy are English on an Indonesian
  page.
- **Count-up from zero on first visit** can read as a loading failure to someone
  scrolling fast, since the card animates 0 → 469 after it enters the viewport.

---

## Questions to Consider

- If a recruiter has 30 seconds for exactly one thing, is "469 contributions" — data
  every developer has — more valuable than "improved data management efficiency by up
  to 40% for a district trade office," which no other applicant can claim? If the second
  is the answer, the current first viewport has its priorities inverted.
- **Bandung is not on the page.** Is that deliberate privacy, or an oversight? It is one
  line, and for the stated primary audience it is close to a filter criterion.
- Should the hero paragraph be cut by half without losing a single verifiable claim?
  Four of its five sentences are things the reader already assumes about a full-stack
  developer.
- Is there a UI state for *absence* — "we don't know" — as distinct from *zero*? The
  error state currently has to choose between lying and showing nothing.
- If the owner had to delete one surface from the first viewport to serve "Contact is
  the destination," which one goes, and why hasn't that answer reached the layout yet?
