---
name: Deni Purwanto — Portfolio
description: A dense, instrumental workbench for a full-stack developer, built on monochrome ink and one switchable accent.
colors:
  ink: "#111111"
  ink-text: "#172036"
  frost: "#ffffff"
  frost-page: "#f8fafc"
  hairline: "#dce5ef"
  hairline-soft: "#e2e8f0"
  slate-soft: "#71829e"
  slate-faint: "#91a3bf"
  signal-green: "#22c55e"
  danger: "#b91c1c"
  card-hover-border: "#000000"
  void: "#000000"
  charcoal: "#0d0d0d"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "clamp(34px, 4.6vw, 47px)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-2.3px"
  headline:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.8px"
  title:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
  label-sm:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
  body-sm:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  hairline: "2px"
  xs: "6px"
  sm: "7px"
  md: "8px"
  md-tight: "9px"
  md-loose: "10px"
  lg: "11px"
  md-wide: "12px"
  xl: "13px"
  bubble: "14px"
  avatar: "15px"
  xxl: "16px"
  panel: "18px"
  panel-lg: "20px"
  pill: "999px"
spacing:
  gutter: "14px"
  gap-sm: "6px"
  gap-md: "9px"
  gap-lg: "12px"
  gap-xl: "14px"
  gap-2xl: "18px"
  panel-pad: "24px"
  hero-pad: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.frost}"
    rounded: "{rounded.md}"
    padding: "10px 11px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.slate-soft}"
    rounded: "{rounded.md}"
    padding: "10px 11px"
  nav-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.xl}"
    padding: "18px"
  card-hover:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.xl}"
  panel:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.panel-pad}"
  chip:
    backgroundColor: "{colors.hairline-soft}"
    textColor: "{colors.slate-soft}"
    rounded: "{rounded.sm}"
    padding: "5px 7px"
  chip-pill:
    backgroundColor: "{colors.frost-page}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  input-search:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.slate-soft}"
    rounded: "{rounded.lg}"
    padding: "6px 8px 6px 11px"
  avatar:
    backgroundColor: "{colors.hairline-soft}"
    textColor: "{colors.ink-text}"
    rounded: "15px"
    height: "76px"
    width: "76px"
  chat-bubble:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.ink-text}"
    rounded: "14px 14px 14px 6px"
    padding: "9px 12px 7px"
---

# Design System: Deni Purwanto — Portfolio

## Overview

**Creative North Star: "The Engine Room"**

An engine room is the part of a ship nobody photographs, and the part that
decides whether the ship works. It is instrument-dense, hot-lit, and every
panel is there because something depends on it. This system is built on that
logic: no ornamental surface, no decorative gradient, no atmosphere-for-its-own
sake. What separates one surface from the next is a hairline and a tone step,
the way a machine separates one plate from the next.

The default is monochrome and stays that way unless the visitor chooses
otherwise. Ink black on white frost, one blue-grey hairline family, and a
six-choice accent picker the reader controls. Colour is a dial, not a
statement — a visitor who picks ocean blue gets a site that is still this
site, only tuned. The five chromatic accents are the same weight of
decision as the theme switch, and nothing in the layout or type changes when
one is applied.

Density is the other load-bearing choice. Body copy sits at 14px, labels at
10px, card padding at 18px, and the base grid gap at 14px. This is a workbench
that expects to be scanned, not a poster that expects to be admired. Every
component is compact enough that four cards and a heading fit in a single
viewport without the reader scrolling to find out what the page is.

Confirmed rejections: heavy `backdrop-filter` glass, saturated brand colour as
a default, emoji-as-iconography, gradient text, and any "modern" pass that adds
a new token tier rather than reusing what `:root` already holds. The owner has
taken back each of these at least once.

**Key Characteristics:**

- Monochrome by default; the accent is a visitor-controlled dial, never a brand
  statement.
- Depth comes from hairline borders and a single tone step, not from shadows.
  Shadows are reserved for genuinely floating things: the chat panel, the
  launcher button, the mobile drawer.
- Small, tight type and small radii. Nothing is oversized for effect.
- One font (Plus Jakarta Sans) at five weights; hierarchy is carried by size,
  weight, and letter-spacing, not by a second family.
- Motion is short and eased-out; every animation has a
  `prefers-reduced-motion` off-switch.

## Colors

A monochrome ink-on-frost palette with a blue-grey neutral family, one live
green, and five optional chromatic accents the reader can select.

### Primary

- **Ink** (`#111111`): the default accent and the system's only true black. It
  paints active navigation, the chat launcher, the section-title icon, and
  GitHub contribution level 4. In dark mode it inverts to `#ffffff` — the
  accent is always the highest-contrast value on the page.
- **Ink Text** (`#172036`): body and heading text in light mode. Deep
  blue-black rather than pure black, so long descriptions do not vibrate
  against the frost surface.

### Secondary

- **Slate Soft** (`#71829e`) and **Slate Faint** (`#91a3bf`): the metadata
  voice. Role lines, timestamps, hints, `kbd` keys, and card descriptions. Slate
  Faint is the lowest-contrast text still allowed — it never carries a claim
  alone.
- **Steel** (`#506782`, `#36516f`, `#243b5a`): mid-weight text that needs more
  presence than the metadata voice but is not a headline.

### Neutral

- **Frost** (`#ffffff`): the card and panel surface in light mode. Cards sit on
  Frost Page, and the separation between them is a single hairline.
- **Frost Page** (`#f8fafc`): the page ground. Deliberately not pure white, so
  a white card on it reads as a raised plate without any shadow.
- **Hairline** (`#dce5ef`) and **Hairline Soft** (`#e2e8f0`): the border
  family. Hairline is the default card and input border; Hairline Soft is for
  quiet internals like the sidebar footer rule and tag chips.
- **Steel** (`#506782`, `#36516f`, `#243b5a`): named tokens
  `--text-muted-2`, `--text-muted-3`, `--text-strong`. They are the mid-weight
  text voice: heavier than the metadata pair, lighter than a headline. See
  Secondary for how they sit in the ramp.
- **Void** (`#000000`) and **Charcoal** (`#0d0d0d`): the dark-mode ground and
  surface. Card-on-black separation in dark mode is carried by `#232323`
  borders, not by tonal lift.

### Named Rules

**The Monochrome Default Rule.** No colour ships as the default state. Ink is
the default accent; the five chromatic accents (ocean `#2563eb`, emerald
`#059669`, violet `#7c3aed`, orange `#ea580c`, rose `#e11d48`) exist only as
visitor choices, are applied identically in light and dark mode, and change
nothing about layout, type, or density. Adding a sixth accent is a data edit
plus a picker dot, not a redesign.

**The Accent Scarcity Rule.** The accent colour paints interactive and live
elements only — active nav, focus outlines, the launcher, contribution level 4,
the "available" dot. It is never a background for a large block of text.

**The One Hairline Rule.** Every separable surface is separated by a 1px
`--border-color` hairline and a tone step. Do not add a second separator
(heavy border, double border, inset ring) to the same edge.

**The Never-Fabricate Palette Rule.** A colour that does not trace to a token in
this file does not ship. There is no decorative tint, no per-category colour
coding, and no gradient used for its own sake.

## Typography

**Display Font:** Plus Jakarta Sans (with Inter → system-ui fallback)
**Body Font:** Plus Jakarta Sans (with Inter → system-ui fallback)
**Label/Mono Font:** none — the system uses the same family throughout

**Character:** A single geometric-humanist sans at five weights. The
personality comes from tight negative letter-spacing at display sizes and
generous line-height at body sizes — the same face reads engineered at 47px and
plainly readable at 14px.

### Hierarchy

- **Display** (800, `clamp(34px, 4.6vw, 47px)`, 1.04, `-2.3px`): the hero name
  on the Dashboard only. Nothing else in the product reaches this size.
- **Headline** (700, 24px, 1.2, `-0.8px`): the sticky page-section title.
- **Title** (600, 16px): card headings, project names, company names, tech
  names, social platform names.
- **Body** (400, 14px, 1.65): the About paragraph, card descriptions, chat
  message text. Hero body copy is the only place 14px runs longer than a few
  lines.
- **Label** (500–700, 10–11px, uppercase for group labels): tags, category
  pills, `kbd` hints, the "MENU" group label, footer credits, timestamps. The
  system leans on 10–13px heavily; that is the density, not an oversight.
- **Body Small / Meta** (400–600, 12–13px): the two steps between Label and
  Body. Card sub-descriptions, chat message text, and composer/button labels
  live here. They are documented steps, not drift.

### Named Rules

**The One Family Rule.** There is no second typeface, and there is no monospace
face. Hierarchy is built from the five weights of Plus Jakarta Sans plus size
and letter-spacing. Introducing a second family changes the product's
character, not just its styling.

**The Small-Label Rule.** Metadata is set small and quiet (10–13px, Slate Soft
or Slate Faint). A label never competes with a body paragraph; when in doubt,
drop it a step rather than colouring it.

**The No-Display-Inside-Mid-Page Rule.** The 47px display treatment belongs to
the Dashboard hero name alone. Section titles cap at 24px.

**The No-New-Spring Rule.** `--ease-spring`
(`cubic-bezier(0.34, 1.56, 0.64, 1)`) overshoots and is documented in the
sidecar for fidelity, not as a pattern. It is used in exactly two incumbent
places — the sidebar nav icon tilt and the theme-toggle knob. Anything new
uses `--ease-out` or `--ease-out-soft`.

## Layout

A fixed sidebar plus a single content column. The sidebar is a floating card,
not a full-height edge rail: `position: fixed`, inset 14px on all sides, width
235px, radius 16px, and its own surface colour and border. Content is offset by
`margin-left: max(263px, calc((100vw - 1713px) / 2 + 263px))` so that on very
wide screens the sidebar tracks the centred content block instead of stranding
itself at the viewport edge. The content column caps at 1450px and is padded
`14px calc(2% + 44px) 65px 2%` — the asymmetric right padding keeps content
clear of the fixed chat launcher.

Inner content caps at 1120px and centres. The Dashboard's first row is a
two-column grid of `minmax(0, 1fr) 260px` with an 18px gap, and `align-items:
stretch` makes the hero card and the dashboard side column the same height.

Card grids are three columns at 14px gaps: Projects, Experience side-by-side,
Awards (2-up), Tech Stack (4-up). The responsive ladder is 1100px (projects
drop to 2-up), 900/860/850/760px (grids collapse), and 390/480/640/700px
(fine adjustments). At ≤760px the sidebar becomes a drawer, a 60px sticky mobile
header appears with a morphing hamburger, body scroll locks while it is open,
and Escape closes it. Grid columns use `minmax(0, 1fr)` throughout so long
words cannot blow out a track.

## Elevation & Depth

This is a flat system. Depth is carried by a 1px hairline border and a
single-step tone difference between page and surface. A white card on
`--bg-page` is already a raised plate because the two values differ; the border
exists to sharpen that edge, not to substitute for it. Shadows are the
exception, and only for things that genuinely float above the page: the chat
panel, the chat launcher button, the mobile drawer, and the sidebar card. A
large panel is not floating — it is part of the page, so it gets the same
hairline as everything else.

### Shadow Vocabulary

- **Panel hairline lift** (`0 1px 2px rgba(15,23,42,.06), 0 16px 40px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.7)`): the five page-level panels and the three dashboard stat cards. This is the system's most-used shadow and it is deliberately quiet. Dark-mode counterpart: `0 1px 0 rgba(255,255,255,.06), 0 16px 40px rgba(0,0,0,.50)`.
- **Float** (`0 10px 22px var(--accent-shadow)`): the chat launcher button, the
  chat panel header controls, and the send button. Accent-tinted, so it tracks
  the visitor's accent choice.
- **Drawer / modal** (`0 24px 60px rgba(0,0,0,.18)` light, `0 24px 60px rgba(0,0,0,.7)` + 1px white 4% ring in dark): the mobile sidebar drawer and the award lightbox modal. The only genuinely dark shadow in the system.
- **Hover lift** (`0 14px 28px rgba(15,23,42,.08)`): project, experience, and
  tech-stack cards on hover, paired with a 3–4px `translateY` and a border
  colour shift to `--card-hover-border`. The one place a card gains height at
  all.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow appears only
as a response to state (hover, floating overlay, focus) or on the four genuinely
floating surfaces named above. Never add a shadow to a static card to "make it
pop" — that pass has been reverted here before.

**The Paired-Dark-Rule.** Every light-mode shadow or border rule is written
together with its `[data-theme='dark']` counterpart in the same change. An
unpaired shadow reads as a smudge on black.

**The Geometry Is Not Yours Rule.** Depth passes change shadows and border
colours only. Never adjust `border-radius`, `padding`, `font-size`, `gap`, or
`width` while doing a depth change — a pass that nudges a card radius by 1px
gets taken back whole.

## Shapes

Small radii throughout, with a clear size ladder rather than a single value.
Interior elements run 6–12px (tags 7px, nav items 8px, avatar 9px, project
icons and toggles 10px, search field and contact cards 11px), content cards and
the chat bubble run 13–14px, the profile photo is 15px, page panels and the
sidebar 16–18px, and the largest overlays 20px. The 2px step belongs to the
GitHub contribution cell alone — a grid of near-square data marks, not a
surface. Pills and circular controls use
999px or 50% (accent swatches, status dot, send button, theme-toggle switch,
language-toggle pill).

One recurring asymmetry: chat bubbles carry a single tucked corner
(`14px 14px 14px 6px` inbound, mirrored `14px 14px 6px 14px` outbound), so the
conversation direction is readable without reading the text. Bordered and
pilled elements are the norm; the system has no sharp-cornered rectangles
except for a few `border-radius: 0` overrides used to square off the ends of
stacked list rows.

## Components

Compact and instrument-like: small type, small radii, one accent, and state
expressed through border and tone rather than decoration.

### Buttons

- **Shape:** compact, 8–11px radius.
- **Primary:** the only solid-fill buttons are the chat launcher (52px circle,
  Ink fill, `--accent-contrast` glyph) and the chat send button (40px circle
  inside the composer). Both fill with `--accent` and carry an accent-tinted
  shadow.
- **Hover / Focus:** nav and theme-toggle buttons fill `--accent-soft` and
  turn `--accent` on hover. Focus-visible is a 2px `--accent` outline at 2px
  offset, never a glow.
- **Secondary / Ghost:** the site has no traditional CTA button. Actions are
  expressed as text links, quick-reply pills, and card hover states rather than
  as filled buttons. Do not introduce a hero CTA button — contact happens
  through the Contact page, email, and CV download.

### Chips (if used)

- **Style:** tags sit on `--border-soft` with a matching 1px border, 7px
  radius, 10px text. Category labels (Web App, Full-Stack, GIS) are pills on
  `--bg-page` with a `--border-color` outline. Assistant quick replies are
  accent-tinted pills (999px radius) that shift to `--accent-soft` on hover
  with a 1px lift.
- **State:** unselected by default; hover swaps the border to
  `--card-hover-border` and fills with `--accent-soft`.

### Cards / Containers

- **Corner Style:** 13px for content cards, 16–18px for page panels and the
  chat panel.
- **Background:** `--bg-surface` (Frost) for cards, `--bg-glass` (Frost at
  97% opacity with a blur) for the large page panels and the sticky section
  title.
- **Shadow Strategy:** see Elevation & Depth. Cards are flat at rest; the hover
  lift is the only state change in height.
- **Border:** 1px `--border-color` on every card. This is the primary separator
  in the system.
- **Internal Padding:** 18px for content cards, 24px for page panels, 32px for
  the hero card.

### Inputs / Fields

- **Style:** the project search field is a 245px pill-adjacent box, 11px radius,
  1px `--border-color` border, transparent input inside, `--text-secondary`
  text, `--text-tertiary` placeholder, and a bordered `kbd` hint on the right.
- **Focus:** the chat composer is the one field with a real focus treatment —
  48px pill, 999px radius, a 22%-alpha black border that goes solid black on
  `:focus-within`. Search and other text fields rely on the border colour.
- **Error / Disabled:** chat errors are a full-width `--danger-soft` band with
  `--danger` text at 12px. Disabled buttons fade to 0.7 opacity and show a
  wait cursor.

### Navigation

- **Style:** the sidebar is the primary nav — a floating 235px card with the
  profile block (76px avatar, 15px radius, live green dot), a small-caps MENU
  label, and a vertical list of items. Each item is a flex row: an 18px Lucide
  icon (stroke 1.8) plus a 13px label, 8px radius, 10px/11px padding.
- **Default / Hover / Active:** default is `--text-secondary` on transparent;
  hover fills `--accent-soft` and turns `--accent`, and the icon rotates -12° and
  scales 1.18; active carries the same fill plus a 2px accent hairline on the
  drawer's left edge. Icons are Lucide at stroke 1.8 — thin, consistent,
  never emoji.
- **Mobile treatment:** at ≤760px the sidebar becomes a fixed drawer, the nav
  is duplicated in a 60px sticky header, and the hamburger is a three-bar
  CSS morph to an X.

### Signature: The Accent Picker

Six 22px circular swatches (default half-black/half-white, then ocean,
emerald, violet, orange, rose) in a bordered row under the theme toggle.
Selecting one writes `data-accent` on `<html>`, which repoints the entire token
set. It is the clearest expression of the product's core idea: one system, six
tunings, no redesign.

### Signature: The Chat Panel

A fixed 360px (max 520px tall) overlay with an accent-gradient header, a
tab bar for "Virtual Assistant" / "Global Chat", a scrolling message area on
`--bg-page`, and a pill composer. Inbound bubbles are Frost on `--bg-surface`
with a tucked corner; outbound bubbles are solid `--accent`. The dark-mode
block gives the panel a real surface hierarchy (panel > message area > bubble)
because pure black on pure black would erase the bubbles.

## Do's and Don'ts

### Do:

- **Do** keep the accent on interactive and live elements only, and keep Ink as
  the default accent.
- **Do** separate every surface with the 1px `--border-color` hairline and a
  tone step, and pair any new light-mode rule with its `[data-theme='dark']`
  counterpart.
- **Do** keep body copy at 14px, metadata at 10–13px, and card padding at 18px;
  match the terseness of whatever you sit next to.
- **Do** use `--accent` for a new "live" or "selected" state, and
  `--accent-soft` for its hover fill.
- **Do** route motion through the existing tokens (`--ease-out` at 0.28s,
  `--dur-base` at 320ms) and add a `prefers-reduced-motion` off-switch with any
  new animation.
- **Do** add a new accent as a data edit plus a picker dot — a `[data-accent]`
  rule, an entry in the accent list, and nothing else.

### Don't:

- **Don't** add a shadow to a static card to make it read as raised; the
  hairline and the tone step already do that, and a shadow-only pass has been
  reverted here before.
- **Don't** change `--radius-*`, `--shadow-*`, spacing, or type sizes while
  doing a depth or colour change — geometry is the owner's call, and a pass that
  nudges a radius by a pixel gets taken back whole.
- **Don't** introduce a second typeface, a monospace face, or a display size
  inside a mid-page section.
- **Don't** make a chromatic accent the default, add a seventh accent with its
  own dark-mode variant, or give an accent its own dark-mode override — accents
  are identical in light and dark.
- **Don't** introduce a hero CTA button, a testimonials wall, a logos wall, or a
  stat that does not trace to data. The visitor's job is to reach the Contact
  page; extra furniture between them and it is a cost, not a feature.
- **Don't** add a trailing bare-selector block at the end of the stylesheet; a
  re-declared `.reveal`, `:focus-visible`, or `::-webkit-scrollbar` rule
  silently outranks the mid-file system that built it.
- **Don't** reintroduce a visitor counter or presence feature. It was built and
  then removed at the owner's request.
