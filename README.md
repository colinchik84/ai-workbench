# Workbench

Live site: https://colinchik84.github.io/ai-workbench/

A learning library for creators getting into AI:

1. **Image prompts** — real prompts with their images, filterable by model, subject and source. Every prompt is colour-coded phrase by phrase (subject, style, light, camera, mood, format, parameters) so you can see *why* it works.
2. **AI repos** — GitHub skills, plugins, MCP servers and agents, sorted by type of work and ranked by how fast they're gaining stars.
3. **Workflow guides** — step-by-step recipes that link to real prompts and repos (`data/guides.json`).

Static site: plain HTML/CSS/JS, no build step. Data lives in `data/` and is refreshed daily by a GitHub Action.

## Run locally

```bash
node scripts/serve.mjs
```

Then open http://localhost:4321.

## Daily data

`.github/workflows/daily-refresh.yml` runs every day and commits fresh data:

| Script | Source | Needs |
|---|---|---|
| `scripts/update-repos.mjs` | GitHub search API | `GITHUB_TOKEN` (automatic in Actions) |
| `scripts/update-prompts.mjs` — Civitai | Civitai public API: images with their exact prompt, model and settings | nothing |
| `scripts/update-prompts.mjs` — X search | X API v2 recent search | `X_BEARER_TOKEN` repo secret (X API Basic tier or higher, paid) |
| `scripts/update-prompts.mjs` — X list | Post URLs you paste into `data/sources/x-tweets.txt` | nothing |

"Rising" for repos is measured from daily star snapshots in `data/repo-history.json`. On the first days it falls back to each repo's average stars per day.

### Adding prompts from X

Free route: paste post URLs (one per line) into `data/sources/x-tweets.txt`. The next run reads each post through X's public embed endpoint and keeps it if it has an image and a prompt (`Prompt: …`, a quoted prompt, a Midjourney line with `--params`, or the image's alt text). This endpoint is unofficial and could change.

Automatic route: add an `X_BEARER_TOKEN` secret. The job then searches recent posts that share prompts for Midjourney, Nano Banana, FLUX, GPT Image and others.

Community images are linked from their source with credit to the creator; they are never re-hosted. Prompts with NSFW terms are dropped at ingest.

### Curated content

- `data/prompts.json` — hand-written Workbench picks, model tips, and the prompt-anatomy breakdowns.
- `data/curated-repos.json` — repos always included and marked as picks.
