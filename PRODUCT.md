# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Creators learning AI: designers, artists and hobbyists who want to get better at prompting image models and find tools that extend their AI. Many are not programmers. They arrive curious, browse visually, and leave with a prompt they can copy or a tool they want to try.

## Product Purpose
Workbench is a learning library with three sections:
1. **Image prompts** — real prompts with their images, filterable by model and subject, each prompt broken down phrase-by-phrase (subject, style, light, camera, mood, format, parameters) so visitors learn *why* it works.
2. **AI repos** — GitHub skills, plugins, MCP servers and agents, sorted by type of work (design, web, game dev, data…), refreshed daily with the fastest-rising repos.
3. **Workflow guides** — step-by-step recipes that combine prompts and tools to get a real task done.

Success: a visitor copies a prompt, understands one new prompting technique, or installs a tool they hadn't heard of.

## Positioning
Most prompt sites are image dumps; most repo lists are static awesome-lists. Workbench annotates every prompt by role and refreshes both prompts and repos automatically every day.

## Operating Context
- Prompts come from three places: hand-written Workbench picks (with images generated for the site), Civitai's public API (daily), and X/Twitter (via the paid API when a token is set, or a pasted list of post URLs).
- Repos come from the GitHub search API daily; "rising" is measured from daily star snapshots.
- Community images are hot-linked to their source with creator credit; never re-hosted.

## Capabilities and Constraints
- Static site: vanilla HTML/CSS/JS, no build step, JSON data files in `data/`.
- Data refreshed by Node scripts in `scripts/` run from a scheduled GitHub Action.
- Gallery must stay work-safe (filtered at ingest).
- Deploy target: undecided (GitHub Pages is the natural fit).
- Workflow guides content: not yet written; must not fabricate tool capabilities.

## Brand Commitments
- Name: **Workbench** (confirmed).
- Look and layout: the user asked to follow **opennana.com**, a prompt gallery site: a light, clean gallery with a rounded search bar, pill filters, masonry image cards, and a detail pop-up with the source, the model and the copyable prompt. This sets the bar for craft and convention. Do not copy its name, logo or content.

## Evidence on Hand
- 8 site-generated sample images in `images/gallery/`.
- Live community prompts in `data/community-prompts.json`; live repos in `data/repos.json`.
- No testimonials, user counts or press — do not invent any.

## Product Principles
1. Teach, don't just show — every prompt explains itself.
2. Credit the source — every community item links back to its creator.
3. Fresh by default — the daily refresh is the reason to come back.
4. Plain language for non-coders, even in the repo section.
