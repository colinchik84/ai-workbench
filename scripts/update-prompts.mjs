#!/usr/bin/env node
// Pulls fresh image prompts into data/community-prompts.json.
//
// Sources:
//   civitai   — free public API; images come with the exact prompt, model and settings.
//   x-api     — X (Twitter) recent search. Needs X_BEARER_TOKEN (X API Basic tier or higher).
//   x-list    — tweet URLs you paste into data/sources/x-tweets.txt. Resolved through X's public
//               embed endpoint (the one embedded tweets use), so no token is needed.
//
// Images are linked from their source (never re-hosted) and every card credits the author.
//
// Usage: node scripts/update-prompts.mjs [--only civitai,x-list] [--dry]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { segmentPrompt, detectFamily, detectSubject, isSafe, tidy } from './lib/anatomy.mjs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('data/community-prompts.json', ROOT);
const X_LIST = new URL('data/sources/x-tweets.txt', ROOT);
const KEEP = 500;            // max prompts kept in the rolling archive
const PER_SOURCE_DAILY = 60; // max new prompts taken from one source per run

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const dry = args.includes('--dry');
const want = name => !only || only.includes(name);
const UA = { 'User-Agent': 'workbench-prompt-gallery/1.0 (+https://github.com)' };

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url, headers = {}) {
  const res = await fetch(url, { headers: { ...UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url.split('?')[0]}`);
  return res.json();
}

function makeEntry(base) {
  const prompt = tidy(base.prompt);
  const fam = detectFamily(base.modelHint, prompt)
    || (base.baseModel && { id: base.baseModel.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: base.baseModel });
  return {
    ...base,
    prompt,
    model: fam?.id ?? 'other',
    modelName: fam?.name || 'Other',
    modelLabel: base.modelLabel || fam?.name || 'Unknown model',
    subject: detectSubject(prompt),
    segments: segmentPrompt(prompt),
    negative: base.negative ? tidy(base.negative).slice(0, 600) : undefined
  };
}

const goodPrompt = p => p && p.length >= 40 && p.length <= 2500 && isSafe(p);

// ───────────────────────── Civitai ─────────────────────────
// One query per model so a single trending model can't crowd out the rest.
const CIVITAI_MODELS = [
  null, 'Nano Banana', 'OpenAI', 'Flux.1 D', 'Flux.1 Kontext', 'Seedream', 'Qwen', 'Imagen4',
  'Krea 2', 'Krea 2 Turbo', 'HiDream', 'SDXL 1.0', 'Illustrious', 'Pony'
];
const PER_MODEL = 8;

function civitaiEntry(it) {
  const m = it.meta || {};
  if (it.type !== 'image' || it.nsfw || it.browsingLevel > 1 || it.nsfwLevel !== 'None') return null;
  if (!goodPrompt(m.prompt) || !isSafe(m.negativePrompt)) return null;
  const settings = [
    m.steps && `Steps ${m.steps}`, m.cfgScale && `CFG ${m.cfgScale}`, m.sampler,
    (m.width || it.width) && `${m.width || it.width}×${m.height || it.height}`
  ].filter(Boolean).join(' · ');
  return makeEntry({
    id: `civitai-${it.id}`,
    source: 'civitai',
    sourceUrl: `https://civitai.com/images/${it.id}`,
    author: it.username,
    authorUrl: it.username ? `https://civitai.com/user/${encodeURIComponent(it.username)}` : undefined,
    // Civitai's CDN serves resized variants when the path segment says so.
    image: it.url.replace('/original=true/', '/width=640/'),
    imageFull: it.url,
    width: it.width, height: it.height,
    prompt: m.prompt,
    negative: m.negativePrompt,
    settings,
    modelHint: `${it.baseModel || ''} ${m.Model || ''}`,
    modelLabel: [it.baseModel, m.Model].filter(Boolean).join(' · '),
    baseModel: it.baseModel,
    likes: (it.stats?.likeCount || 0) + (it.stats?.heartCount || 0),
    createdAt: it.createdAt
  });
}

async function fromCivitai() {
  // Prefer prompts that teach something: favour reactions, penalise tag soup.
  const tagSoup = e => (e.prompt.match(/,/g) || []).length / e.prompt.split(/\s+/).length > 0.45;
  const rank = e => e.likes * (tagSoup(e) ? 0.4 : 1);
  const seen = new Set();
  const perFamily = {};
  const out = [];
  for (const base of CIVITAI_MODELS) {
    for (const period of ['Week', 'Month']) {
      const q = new URLSearchParams({ limit: '100', sort: 'Most Reactions', period, nsfw: 'None', withMeta: 'true' });
      if (base) q.set('baseModels', base);
      let items = [];
      try { ({ items = [] } = await getJSON(`https://civitai.com/api/v1/images?${q}`)); }
      catch (err) { console.log(`  civitai ${base || 'all'}: ${err.message}`); }
      await sleep(700);
      const entries = items.map(civitaiEntry).filter(Boolean).sort((a, b) => rank(b) - rank(a));
      let took = 0;
      for (const e of entries) {
        if (seen.has(e.id) || (perFamily[e.model] || 0) >= PER_MODEL) continue;
        seen.add(e.id); perFamily[e.model] = (perFamily[e.model] || 0) + 1; out.push(e); took++;
      }
      if (took >= 3 || (perFamily[entries[0]?.model] || 0) >= PER_MODEL) break; // Week was enough
    }
  }
  return out.slice(0, PER_SOURCE_DAILY * 2);
}

// ───────────────────────── X helpers ─────────────────────────
// Pull the prompt out of a tweet. People share it as "Prompt: …", in quotes after a 👇,
// in the image alt text, or as a bare Midjourney line ending in --params.
export function extractPromptFromTweet(text, altTexts = []) {
  const clean = (text || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/(^|\s)[#@]\w+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
  const labelled = clean.match(/(?:^|\n|\s)(?:prompt|prompts|提示词)\s*(?:[:：\-–—]|👇|⬇️|↓)+\s*([\s\S]{30,})/i);
  if (labelled) return labelled[1].replace(/^["“'”]+|["“'”]+$/g, '').trim();
  const quoted = clean.match(/[“"]([^”"]{60,})[”"]/);
  if (quoted) return quoted[1].trim();
  if (/\s--(ar|v|stylize|s|niji|sref|chaos)\b/.test(clean)) return clean;
  const alt = altTexts.find(a => a && a.length > 60 && !/^image$/i.test(a));
  if (alt) return alt.replace(/^prompt\s*[:：]\s*/i, '').trim();
  return null;
}

const tweetToEntry = t => {
  const prompt = extractPromptFromTweet(t.text, t.alts);
  if (!goodPrompt(prompt) || !isSafe(t.text) || !t.image) return null;
  return makeEntry({
    id: `x-${t.id}`,
    source: 'x',
    sourceUrl: `https://x.com/${t.username}/status/${t.id}`,
    author: `@${t.username}`,
    authorUrl: `https://x.com/${t.username}`,
    image: t.image.includes('pbs.twimg.com/media') ? t.image.replace(/(\.\w+)?$/, '') + '?format=jpg&name=small' : t.image,
    imageFull: t.image.includes('pbs.twimg.com/media') ? t.image.replace(/(\.\w+)?$/, '') + '?format=jpg&name=large' : t.image,
    width: t.width, height: t.height,
    prompt,
    modelHint: t.text,
    likes: t.likes || 0,
    createdAt: t.createdAt
  });
};

// ───────────────────────── X API (paid) ─────────────────────────
async function fromXApi() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) { console.log('  x-api: skipped (set X_BEARER_TOKEN to enable)'); return []; }
  const query = [
    '(prompt OR "prompt:" OR "prompt 👇")',
    '(midjourney OR "nano banana" OR nanobanana OR flux OR "gpt image" OR chatgpt OR ideogram OR imagen OR seedream OR aiart)',
    'has:images -is:retweet lang:en'
  ].join(' ');
  const params = new URLSearchParams({
    query, max_results: '100', sort_order: 'relevancy',
    expansions: 'attachments.media_keys,author_id',
    'tweet.fields': 'created_at,public_metrics,note_tweet',
    'media.fields': 'url,width,height,alt_text,type',
    'user.fields': 'username'
  });
  const j = await getJSON(`https://api.x.com/2/tweets/search/recent?${params}`, { Authorization: `Bearer ${token}` });
  const media = new Map((j.includes?.media || []).map(m => [m.media_key, m]));
  const users = new Map((j.includes?.users || []).map(u => [u.id, u]));
  const out = [];
  for (const tw of j.data || []) {
    const ms = (tw.attachments?.media_keys || []).map(k => media.get(k)).filter(m => m?.type === 'photo');
    const e = tweetToEntry({
      id: tw.id,
      text: tw.note_tweet?.text || tw.text,
      alts: ms.map(m => m.alt_text),
      image: ms[0]?.url, width: ms[0]?.width, height: ms[0]?.height,
      username: users.get(tw.author_id)?.username || 'i',
      likes: tw.public_metrics?.like_count,
      createdAt: tw.created_at
    });
    if (e) out.push(e);
  }
  return out.sort((a, b) => b.likes - a.likes).slice(0, PER_SOURCE_DAILY);
}

// ───────────────────────── X URL list (free) ─────────────────────────
// Same token formula embedded tweets use for cdn.syndication.twimg.com.
const syndicationToken = id => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');

async function fromXList(existingIds) {
  if (!existsSync(X_LIST)) return [];
  const ids = (await readFile(X_LIST, 'utf8'))
    .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => l.match(/status(?:es)?\/(\d+)/)?.[1] || (/^\d+$/.test(l) ? l : null)).filter(Boolean);
  const out = [];
  for (const id of [...new Set(ids)]) {
    if (existingIds.has(`x-${id}`)) continue;
    try {
      const t = await getJSON(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${syndicationToken(id)}&lang=en`);
      const photo = (t.mediaDetails || []).find(m => m.type === 'photo');
      const e = tweetToEntry({
        id,
        text: t.note_tweet?.note_tweet_results?.result?.text || t.text,
        alts: (t.mediaDetails || []).map(m => m.ext_alt_text),
        image: photo?.media_url_https,
        width: photo?.original_info?.width, height: photo?.original_info?.height,
        username: t.user?.screen_name || 'i',
        likes: t.favorite_count,
        createdAt: t.created_at
      });
      if (e) out.push(e);
      else console.log(`  x-list: ${id} — no prompt or image found, skipped`);
    } catch (err) {
      console.log(`  x-list: ${id} — ${err.message}`);
    }
    await sleep(400);
  }
  return out;
}

// ───────────────────────── main ─────────────────────────
const prev = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : { prompts: [] };
const byId = new Map(prev.prompts.map(p => [p.id, p]));
const counts = {};
const today = new Date().toISOString();

const sources = [
  ['civitai', fromCivitai],
  ['x-api', fromXApi],
  ['x-list', () => fromXList(new Set(byId.keys()))]
];
for (const [name, fn] of sources) {
  if (!want(name)) continue;
  try {
    const found = await fn();
    let added = 0;
    for (const e of found) {
      if (!byId.has(e.id)) added++;
      byId.set(e.id, { ...byId.get(e.id), ...e, addedAt: byId.get(e.id)?.addedAt || today });
    }
    counts[name] = added;
    console.log(`${name}: ${found.length} found, ${added} new`);
  } catch (err) {
    console.warn(`${name}: failed — ${err.message}`);
    counts[name] = 0;
  }
}

// Newest additions first, then by popularity; cap the archive.
const prompts = [...byId.values()]
  .sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || '') || b.likes - a.likes)
  .slice(0, KEEP);

const result = { generatedAt: today, added: counts, total: prompts.length, prompts };
if (dry) console.log(JSON.stringify(result.prompts.slice(0, 2), null, 2));
else {
  await mkdir(new URL('data/', ROOT), { recursive: true });
  await writeFile(OUT, JSON.stringify(result, null, 1) + '\n');
  console.log(`wrote ${prompts.length} prompts → data/community-prompts.json`);
}
