---
name: Workbench
description: A light, clean prompt gallery where every prompt is annotated by role.
colors:
  primary: "#0e7490"
  primary-soft: "#e0f6fb"
  primary-hairline: "#7dd3e8"
  gradient-end: "#2563eb"
  focus-cyan: "#06b6d4"
  canvas: "#f8fafc"
  panel: "#f1f5f9"
  surface: "#ffffff"
  ink: "#0f172a"
  ink-secondary: "#475569"
  ink-muted: "#64748b"
  hairline: "#e2e8f0"
  hairline-strong: "#cbd5e1"
  image-well: "#e9eef4"
  note-tint: "#f0f9ff"
  note-ink: "#0c4a6e"
  role-subject: "#2563eb"
  role-style: "#9333ea"
  role-light: "#d97706"
  role-camera: "#0d9488"
  role-mood: "#e11d48"
  role-format: "#64748b"
  role-params: "#4f46e5"
  role-negative: "#be123c"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(26px, 3.4vw, 34px)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14.5px"
    fontWeight: 650
    lineHeight: 1.4
  lead:
    fontFamily: "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  prompt:
    fontFamily: "Cascadia Mono, Consolas, SF Mono, Menlo, ui-monospace, monospace"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.9
  prompt-snippet:
    fontFamily: "Cascadia Mono, Consolas, SF Mono, Menlo, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  segment: "3px"
  code: "5px"
  thumb: "8px"
  inset: "10px"
  card: "12px"
  panel: "14px"
  hero: "16px"
  sheet: "18px"
  pill: "999px"
spacing:
  chip-gap: "8px"
  grid-gap: "16px"
  wall-gap: "18px"
  gutter: "24px"
  gutter-mobile: "16px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "46px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "42px"
  search-field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "46px"
  search-field-focus:
    backgroundColor: "{colors.surface}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "34px"
  chip-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
  nav-link:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  nav-link-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 14px 14px"
  tag:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  tag-kind:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
  tag-pick:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  tag-new:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  prompt-box:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.prompt}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
---

# Design System: Workbench

## Overview

**Creative North Star: "The Annotated Gallery"**

Workbench plays the prompt-gallery category straight, at full craft: a cool near-white page, white rounded cards that lift gently off it, slate ink, and pill-shaped everything a hand touches (search, chips, nav, tags, buttons). The image wall is the hero; chrome is quiet so pictures and prompts carry the colour. The one place the system departs from category habit is the prompt itself, which is never an undifferentiated text blob: every phrase can be coloured by its role (subject, style, light, camera, mood, format, parameters, negative).

Density is gallery-dense, not dashboard-dense. Cards sit 18px apart in a five-column masonry wall, filters live in one soft panel directly above it, and type stays in a single system sans so the interface reads as tool rather than brand. Mono type appears only where a prompt is being shown, which makes "this is a prompt" legible at a glance.

**Key Characteristics:**
- Cool near-white canvas with white 12px cards on soft, low-contrast offset shadows.
- Pill geometry for every interactive control.
- One cyan accent family; a single cyan-to-blue gradient reserved for the primary button.
- System sans throughout; mono only for prompt text.
- Prompt-anatomy role colours are the only other hues in the system.

## Colors

A restrained slate-and-cyan palette on a cool white ground, with a rainbow held entirely in reserve for prompt anatomy.

### Primary
- **Deep Lagoon Cyan** (`primary`): the one accent. Active chip and nav text, kind tags, Pick tags, link buttons ("Copy", source links), live result counts, step-number discs, gain icons. Also the gradient's start stop.
- **Pale Lagoon** (`primary-soft`): the fill of every selected or "this is the current one" state: active chip, active nav link, kind tag, step disc, link-button hover.
- **Lagoon Hairline** (`primary-hairline`): the 1px edge on active chips, the Pick tag's inset ring, and the search field's focus border.
- **Signal Blue** (`gradient-end`): the gradient's end stop on the primary button only. It also serves as the subject role colour; outside those two uses it does not appear.
- **Focus Cyan** (`focus-cyan`): the 2px focus-visible outline, the anatomy switch's on state, and the detail sheet's block-heading marker.

### Neutral
- **Cool Paper** (`canvas`): page background.
- **Mist Panel** (`panel`): the filter panel, resting search field, prompt toolbar, inline code, generic and New tags, nav hover.
- **White** (`surface`): cards, chips, sheet, header (at 92% with blur), footer.
- **Slate Ink** (`ink`): headings, titles, prompt text, and the dark backdrop of the image pane in the sheet.
- **Slate Secondary** (`ink-secondary`): body copy in cards, chip labels, descriptions, gain figures.
- **Slate Muted** (`ink-muted`): meta lines, counts, subtitles, owner prefixes. On white it clears 4.5:1; see the Do's and Don'ts for where it does not.
- **Hairline** (`hairline`) and **Strong Hairline** (`hairline-strong`): chip and field borders at rest and on hover; header and footer rules; the step timeline.
- **Image Well** (`image-well`): placeholder behind images while they load.
- **Note Tint / Note Ink** (`note-tint`, `note-ink`): the "Why it works" callout in the sheet, the only tinted text block.

### Tertiary: Prompt Anatomy
Eight role colours (`role-subject`, `role-style`, `role-light`, `role-camera`, `role-mood`, `role-format`, `role-params`, `role-negative`) mark phrases in prompt text. Each segment gets an 11% tint of its role colour and a 2px underline at 70%; the legend shows a 9px swatch per role. They are never used as text colour for body copy and never decorate chrome.

### Named Rules
**The Anatomy-Only Rule.** Besides slate and cyan, colour exists only to label prompt roles. If a new surface needs a hue, it is a prompt role or it is cyan. The single sanctioned borrow is the Saved state of the Save button, which uses the mood rose for the filled heart.

**The One Gradient Rule.** The cyan-to-blue gradient (90deg, `primary` to `gradient-end`) appears on the primary Search button and nowhere else. One per view.

## Typography

**Display Font:** system-ui (with -apple-system, Segoe UI, Helvetica Neue, Arial, PingFang SC, Microsoft YaHei)
**Body Font:** the same system stack
**Label/Mono Font:** Cascadia Mono (with Consolas, SF Mono, Menlo, ui-monospace)

**Character:** a native, unbranded sans that lets images lead, given weight through heavy display cuts (800) and tight negative tracking; mono is a semantic marker, not a style.

### Hierarchy
- **Display** (800, clamp(26px, 3.4vw, 34px), 1.2, -0.02em): one page title per view, balanced wrap.
- **Headline** (750, 20px, -0.01em): section heads ("Rising fastest", "All repos"); the sheet title uses the same weight at 21px.
- **Title** (650, 14.5px, 1.4): card titles, clamped to two lines; repo names at 15px; guide and step titles at 17px.
- **Lead** (400, 17px, 1.6): the one-line page subtitle in muted slate, max 70ch; 15.5px on mobile.
- **Body** (400, 15px, 1.6): default; card descriptions run 13.5 to 14px in secondary slate; step prose capped at 68ch.
- **Label** (500, 12px): tags, chip counts, the model pill. Chips themselves are 14px. Numbers use tabular figures wherever they count (likes, stars, gains, counts, step numbers).
- **Prompt** (mono 400, 13.5px, 1.9): full prompt text in the sheet. The tall leading is there so role tints and underlines do not collide across lines.
- **Prompt Snippet** (mono 400, 12.5px, 1.75): text-only cards and reference prompts in guides, line-clamped.

### Named Rules
**The Mono-Means-Prompt Rule.** Monospace marks prompt text and inline code, nothing else. Never set UI labels, numbers or headings in mono.

**The No-Eyebrow Rule.** Headings stand alone. There are no small uppercase kicker labels above titles anywhere in the system.

## Layout

A centred container (max 1320px, 24px side gutters, 16px at 600px and below) under a sticky 56px header. Each view opens with the same stack: display title, lead subtitle, then one search row (pill field up to 520px, gradient button, live count), then the filter panel, then content.

- **Masonry wall:** CSS columns, five at 220px minimum, 18px gaps; two columns with 12px gaps at 600px and below.
- **Card grids:** auto-fill grids at 280px (model tips), 300px (guides) and 340px (repos) minimum, 16 to 18px gaps; repos collapse to one column on mobile.
- **Rising strip:** a horizontally scrolling row of 260px minimum cards.
- **Reading column:** guides cap at 780px; a numbered step timeline with 32px discs and a 1px connecting rule.
- **Section rhythm:** 48px above each section head, 16px below.
- **Detail sheet:** a centred dialog up to 1080px, split image | text 50/50; at 860px and below it becomes a full-width bottom sheet (92dvh, top corners only) with the image stacked above the text.

**The Wrap-Then-Scroll Rule.** Filter chip rows wrap onto multiple lines on desktop so every option is visible; at 600px and below each row becomes a single sideways-scrolling line with the scrollbar hidden.

## Elevation & Depth

Depth is soft and ambient: slate-tinted, low-opacity, offset downward with a slight negative spread so shadows pool under cards rather than haloing them. Surfaces at rest sit just off the canvas; hover lifts them 2px and deepens the shadow. Filters, chips and fields are flat (border or tint only). The header and sheet header use translucent white with backdrop blur rather than shadow.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgb(15 23 42 / .05), 0 4px 12px -2px rgb(15 23 42 / .06)`): every card, tip, reference block, secondary button, sheet close button.
- **Lift** (`box-shadow: 0 2px 4px rgb(15 23 42 / .06), 0 14px 28px -8px rgb(15 23 42 / .16)`): hover state of clickable cards, paired with `translateY(-2px)`.
- **Button** (`box-shadow: 0 1px 2px rgb(15 23 42 / .12), 0 4px 10px -4px rgb(15 23 42 / .22)`): the primary gradient button.
- **Sheet** (`box-shadow: 0 30px 80px -20px rgb(15 23 42 / .45)`): the detail dialog, over a 50% slate backdrop with 2px blur.

### Named Rules
**The Soft-Lift Rule.** Clickable cards rise 2px and take the Lift shadow on hover (0.2s); nothing else moves on hover. Shadows are always soft and slate-tinted, never hard-edged or black.

## Shapes

Two families of corner: pills (999px) for anything you press or that labels state (buttons, search field, chips, nav links, tags, sort select, switch), and gently rounded rectangles for anything that holds content (12px cards and prompt box, 14px filter panel, 16px guide hero, 18px sheet). Thumbnails take 8px, the "Why it works" note 10px, inline code 5px, prompt role segments 3px. Borders are 1px hairlines only; there are no thick borders or side stripes on containers. Step numbers sit in 32px circles.

## Components

### Buttons
Confident but quiet; only one is ever loud.
- **Shape:** full pill (999px).
- **Primary:** the cyan-to-blue gradient, white 600-weight text, 46px tall, 26px side padding, Button shadow. Hover brightens 6%; active presses down 1px.
- **Secondary ("Load more"):** white with a hairline border and Rest shadow, secondary slate text, 42px; hover darkens text and border.
- **Toggle (Save):** 34px white pill with a hairline and an SVG heart; pressed state fills the heart and shifts to rose on a pale rose tint.
- **Link button (Copy, etc.):** borderless cyan text with an SVG icon; hover adds a pale cyan fill at 6px radius.
- **Close:** a 38px white circle with hairline and Rest shadow.

### Chips
- **Style:** 34px white pills with a 1px hairline, 14px secondary slate text, optional 15px SVG icon and a 12px muted tabular count.
- **State:** hover strengthens border and text; selected (`aria-pressed="true"`) is pale cyan fill, cyan hairline, cyan 500-weight text, and the count turns cyan. Every row has an "All" chip as its reset.

### Tags
Small 12px pills, 2px by 9px, on three deliberately distinct treatments:
- **Kind / level** (what something is): pale cyan fill, cyan text.
- **Pick** (editorial endorsement): white with a cyan inset hairline, cyan 600 text, and a filled 12px SVG star. It must read differently from a kind tag.
- **New**: panel fill with full ink at 600 weight; neutral, not accented.
- **Generic** (categories, durations, tools): panel fill, secondary slate.
- **Image overlay** (model name on gallery images): white 12px text on 55% slate with 4px blur, pinned top-left at 10px.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** white on the cool canvas; image cards place the photo flush at the top over the image well.
- **Shadow Strategy:** Rest, Lift on hover (see Elevation & Depth).
- **Border:** none.
- **Internal Padding:** 12px 14px 14px on gallery cards (10px 11px 12px on mobile), 16px on text-only and rising cards, 16px 18px on repo and guide bodies, 18px 20px on tips.
- **Meta line:** muted 12.5 to 13px, with an SVG heart for likes, an SVG star for stars, an SVG clock for duration.
- **Gain:** secondary slate 600 tabular figure led by a cyan trend-up SVG icon; the number is never coloured.

### Inputs / Fields
- **Search:** 46px pill, panel fill, hairline border, muted search icon, placeholder at #5b6b80. Focus moves the fill to white and the border to the cyan hairline. Caret is cyan.
- **Select:** 34px white pill with a hairline, matching chips.
- **Switch:** 30 by 18px track in strong hairline grey, white knob; on, the track turns focus cyan.
- **Focus (global):** 2px focus-cyan outline, 2px offset.

### Navigation
Wordmark (700, 19px) left; three pill links right in 14.5px 500 secondary slate. Hover gives a panel fill; the current view takes pale cyan fill with cyan text. The header is sticky, 92% white with saturate and blur and a hairline underneath. On mobile the links tighten to 10px side padding.

### Prompt Box (signature)
The detail sheet's core: a 12px hairline-bordered box with a panel toolbar (muted 13px labels, the "Highlight anatomy" switch, a cyan Copy link button) above the full mono prompt. Switching anatomy on wraps each role segment in its role tint and underline, and a legend of 9px swatches follows. Below sit the "Why it works" note and a key/value list of source, model and settings. The sheet animates in with a 16px rise and slight scale (0.28s, cubic-bezier(.16, 1, .3, 1)); on mobile it slides up from the bottom.

## Do's and Don'ts

### Do:
- **Do** keep every pressable control a pill (999px) and every content container a 12 to 18px rounded rectangle.
- **Do** show the active state of any filter or nav item as pale cyan fill, cyan hairline and cyan text.
- **Do** keep Pick, kind and New tags visually distinct: hairline-and-star, cyan fill, and neutral panel respectively.
- **Do** draw every icon, including hearts and stars, as an inline SVG at 1.8 stroke using currentColor.
- **Do** use tabular figures for every count, rank, star, like and gain.
- **Do** let chip rows wrap on desktop and scroll sideways at 600px and below.
- **Do** keep text at 4.5:1 contrast or better against the surface it actually sits on, not just against white.
- **Do** honour reduced motion: animations and transitions switch off entirely.

### Don't:
- **Don't** use the cyan-to-blue gradient on anything but the primary button.
- **Don't** introduce hues outside slate, cyan and the prompt-anatomy roles.
- **Don't** set anything but prompt text and inline code in mono.
- **Don't** put eyebrow or kicker labels above headings.
- **Don't** use text glyphs or emoji as icons (no typed hearts or stars).
- **Don't** colour gain numbers; the cyan lives on the icon only.
- **Don't** use hard, black, or zero-blur offset shadows; depth is soft and slate-tinted.
