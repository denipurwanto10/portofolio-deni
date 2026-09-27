# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters and HR who scan fast for a full-time or freelance
candidate. They arrive from a link (LinkedIn, GitHub, a job application, a
direct message) and give the site a short, skimming read before deciding
whether to reach out. Secondary: peers and fellow developers who open it out of
curiosity.

The reader is not a peer reading for craft critique. They want evidence that
Deni can do the job, fast, and a way to respond in one action.

## Product Purpose

A personal portfolio for Deni Purwanto, a full-stack developer in Bandung,
that turns a short visit into a contact attempt. Success is a recruiter or
client reaching out through the contact page or email — not page views, not
time on site.

## Positioning

Every claim on the site is backed by a shipped, linkable artifact: source code
on GitHub, live demos, real agency and internship engagements (PATGL/ESDM,
Mandiri x Rakamin Academy, Disdagperin Kabupaten Bandung, UNLA laboratory
assistant), and scanned award/certificate images. The differentiator against a
generic portfolio is verifiable professional history in Indonesian public-sector
and education contexts, including geospatial/GIS work that most web
candidates cannot show.

## Operating Context

- Static SPA deployed on Vercel (`vercel.json` rewrites all non-`/api` paths to
  `index.html`; `api/github-contributions.js` serves the contributions feed).
- Six live routes: Dashboard, Experience, Projects, Awards & Certs, Tech Stack,
  Contact. Community and Blog pages exist in `src/pages/` but are commented out
  of the nav — not shipped surfaces.
- Bilingual EN/ID. English is the source language; Indonesian is a dictionary
  in `src/manualTranslations.ts` applied by walking the DOM. There is no i18n
  library and no per-locale routing.
- Light and dark themes plus six accent choices, chosen by the visitor and
  persisted to `localStorage`, applied before first paint.
- An in-page AI chat assistant answers questions about Deni. It is a
  deterministic keyword/lookup bot (not a model call); its Firestore-backed
  realtime layer is optional and only activates when `VITE_FIREBASE_*` is
  configured.
- The site defends its own content: copy, cut, drag, and the context menu are
  blocked except inside editable fields.
- Long CV PDF served from `public/resume/`.

## Capabilities and Constraints

Confirmed functionality to preserve:

- Sidebar navigation with URL push/popState routing, mobile drawer with scroll
  lock and Escape-to-close, and a mobile header.
- Project search/filter on the Projects page; CV download; social links; CV
  years, graduation year, and the graduation year itself are deliberately not
  stated where the user has not supplied them — the bot says so rather than
  guessing.
- GitHub contributions calendar and an all-time longest-streak record read from
  a tracked JSON (`src/data/streakRecord.json`), refreshed by a script. The
  record does not self-update without a job to refresh it.
- Code-splitting and lazy loading are load-bearing, not incidental: every page
  except Dashboard is `lazy()`, and the ~4,700-line chat plus the Firebase SDK
  load only on intent (hover/focus/touch) via `LiveChatLoader`. The Firebase
  web API key is intentionally public in the client bundle; Firestore rules and
  HTTP-referrer restrictions are the actual protection.
- The visitor counter / presence feature was built and then removed at the
  owner's request. It must not be reintroduced unprompted.

Constraints future work must respect:

- No invented numbers, clients, testimonials, or outcomes. Every statistic on
  the site traces to `src/data.ts`, a certificate image, or a tracked JSON.
- Design tokens (`--radius-*`, `--shadow-*`, the accent palettes, `:root` color
  values) are the owner's knobs. The multi-theme system is part of the product,
  not a layer to simplify away.
- Copy stays short. Long descriptions get rejected; the terseness of a string
  should match its neighbours.
- Assets live in `public/` under their existing directories (`images/`,
  `experience/`, `awards/`, `resume/`). Never reference a path no file backs.
- Indonesian copy is casual and conversational, not bureaucratic.
- The in-page assistant's replies are Indonesian in the source by convention;
  they are excluded from the DOM translator.

## Brand Commitments

- Name: Deni Purwanto. Role line: "Full Stack Developer". Based in Bandung,
  West Java (WIB, UTC+7).
- Bilingual EN/ID with English as the source; Indonesian reads as natural
  everyday Indonesian, not translated register.
- Identity assets: `/images/deni.webp` (logo/favicon, with a dark variant
  `nous-girl-dark.png`), `/profil.webp` (profile photo, also the mobile LCP
  image), `/profile-placeholder.svg` (fallback).
- Typeface: Plus Jakarta Sans, loaded async so it never blocks first paint.
- Contact channels are fixed product facts: `denipurwanto800@gmail.com`,
  LinkedIn `/in/deniiprwnt`, GitHub `denipurwanto10`.
- Sidebar footer credit "DESIGNED & BUILT BY Deni Purwanto — © 2026 All Rights
  Reserved" is part of the identity.

## Evidence on Hand

- `src/data.ts`: the project catalogue (title, description, tags, GitHub link,
  live demo URL where one exists, language, category) and the work history with
  per-role achievements.
- `public/awards/`: scanned certificates (university internship programme,
  best-performing student, Hartik UI/UX 2nd place, laboratory assistant and
  teaching instructor for July 2023 and July 2024).
- `public/experience/`: employer imagery per engagement.
- `public/resume/CV Deni Purwanto.pdf`.
- `src/data/streakRecord.json`: the all-time GitHub streak record.
- Live demos hosted on Vercel for some projects; the rest are GitHub-only.

Absences future work must not paper over: no client testimonials, no logos wall,
no traffic or download numbers, no team or employer quotes, no published rates,
no graduation year, no blog posts shipped.

## Product Principles

1. **Evidence over adjectives.** A link, a demo, a scanned certificate, or a
   number traceable to data. If the proof does not exist, the claim does not go
   on the page.
2. **Contact is the destination.** The site's job ends when the reader has a
   working way to reply; every surface should shorten that path rather than
   add one more reason to keep browsing.
3. **Skimmable in thirty seconds.** A recruiter reads in fragments, often on a
   phone, often once. Hierarchy, short copy, and a visible contact path outrank
   depth and density.
4. **The owner's tokens are the design system.** Theming and accent choice are
   product features the visitor uses; they are not incidental styling to be
   rationalised away.
5. **Performance is part of the craft.** The first paint must not wait on
   non-Dashboard code, the chat SDK, or a blocking font request.
