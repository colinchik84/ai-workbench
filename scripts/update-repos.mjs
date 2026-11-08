#!/usr/bin/env node
// Finds GitHub repos that extend AI agents (skills, plugins, MCP servers, agents, rules),
// sorts them into kinds of work, and measures how fast each is gaining stars.
//
// Writes data/repos.json for the site and data/repo-history.json (daily star snapshots,
// which is how "rising" is measured once the job has run for a few days).
//
// Set GITHUB_TOKEN for higher rate limits (the GitHub Action provides one automatically).
// Usage: node scripts/update-repos.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('data/repos.json', ROOT);
const HISTORY = new URL('data/repo-history.json', ROOT);
const CURATED = new URL('data/curated-repos.json', ROOT);
const MAX_REPOS = 600;
const HISTORY_DAYS = 45;

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'workbench-repo-tracker',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};
// Search API: 30 req/min with a token, 10 without.
const SEARCH_GAP = token ? 2200 : 6500;

const day = (d = new Date()) => d.toISOString().slice(0, 10);
const daysAgo = n => day(new Date(Date.now() - n * 864e5));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── what to search for ──
const TOPICS = [
  'claude-code', 'claude-skills', 'agent-skills', 'claude-code-plugin', 'claude-code-plugins', 'claude-code-skills',
  'mcp-server', 'model-context-protocol', 'mcp-servers', 'mcp',
  'cursor-rules', 'codex-cli', 'gemini-cli', 'ai-agents', 'ai-coding-assistant', 'prompt-engineering', 'llm-tools',
  'subagents', 'vibe-coding'
];
const PHRASES = ['"claude code" skill', '"claude code" plugin', '"mcp server"', '"agent skills"', '"cursor rules"', '"codex" skills'];

function queries() {
  const active = `pushed:>=${daysAgo(120)}`;
  const qs = [];
  for (const t of TOPICS) {
    qs.push(`topic:${t} stars:>=40 ${active}`);
    qs.push(`topic:${t} stars:>=5 created:>=${daysAgo(30)}`); // brand-new risers
  }
  for (const p of PHRASES) {
    qs.push(`${p} in:name,description stars:>=40 ${active}`);
    qs.push(`${p} in:name,description stars:>=5 created:>=${daysAgo(30)}`);
  }
  return qs;
}

async function gh(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
      const wait = Math.min(Math.max(reset - Date.now(), 5000), 65000);
      console.log(`  rate limited, waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    if (res.status === 404) return null;
    throw new Error(`${res.status} ${await res.text()}`);
  }
  throw new Error('gave up after rate limiting');
}

// ── classification ──
const CATEGORIES = {
  Design: ['design', 'designer', 'figma', 'ui', 'ux', 'css', 'tailwind', 'tailwindcss', 'svg', 'icon', 'icons', 'typography', 'illustration', 'canva', 'shadcn', 'frontend-design', 'branding', 'color', 'sketch', 'penpot', 'framer', 'design-system', 'mockup', 'image-generation', 'midjourney', 'comfyui', 'stable-diffusion'],
  'Web dev': ['web', 'website', 'frontend', 'react', 'nextjs', 'next.js', 'vue', 'svelte', 'html', 'browser', 'playwright', 'puppeteer', 'seo', 'wordpress', 'shopify', 'vercel', 'landing', 'webapp', 'fullstack', 'full-stack', 'chrome', 'scraping', 'scraper', 'crawler', 'astro', 'nuxt', 'django', 'rails', 'laravel', 'supabase'],
  'Game dev': ['game', 'games', 'gamedev', 'game-development', 'unity', 'unity3d', 'unreal', 'unreal-engine', 'godot', 'blender', '3d', 'threejs', 'three.js', 'roblox', 'minecraft', 'pixel-art', 'sprite', 'shader', 'shaders', 'bevy', 'phaser', 'gamemaker'],
  'Data & ML': ['data', 'database', 'sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'analytics', 'pandas', 'ml', 'machine-learning', 'rag', 'vector', 'embeddings', 'jupyter', 'notebook', 'spreadsheet', 'excel', 'bigquery', 'snowflake', 'duckdb', 'clickhouse', 'etl', 'finance', 'trading', 'stocks', 'research', 'arxiv'],
  'DevOps & cloud': ['devops', 'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'terraform', 'ci', 'cicd', 'github-actions', 'deploy', 'deployment', 'cloud', 'infrastructure', 'monitoring', 'observability', 'linux', 'server', 'cloudflare', 'sre'],
  'Coding & review': ['code-review', 'review', 'testing', 'tests', 'tdd', 'refactor', 'refactoring', 'git', 'github', 'lsp', 'ide', 'vscode', 'debugging', 'debug', 'typescript', 'python', 'rust', 'golang', 'java', 'linter', 'lint', 'pr', 'pull-request', 'codebase', 'context-engineering', 'memory', 'spec', 'spec-driven'],
  'Writing & docs': ['writing', 'writer', 'docs', 'documentation', 'markdown', 'notion', 'obsidian', 'blog', 'content', 'notes', 'pdf', 'docx', 'pptx', 'slides', 'presentation', 'translation', 'copywriting', 'knowledge'],
  'Automation': ['productivity', 'workflow', 'workflows', 'automation', 'email', 'gmail', 'calendar', 'slack', 'discord', 'telegram', 'todo', 'task', 'tasks', 'zapier', 'n8n', 'scheduler', 'orchestration', 'multi-agent', 'swarm'],
  'Media': ['video', 'audio', 'music', 'image', 'images', 'ffmpeg', 'youtube', 'tts', 'speech', 'voice', 'photo', 'podcast', 'tiktok', 'social-media', 'marketing'],
  Mobile: ['ios', 'android', 'swift', 'swiftui', 'flutter', 'react-native', 'mobile', 'kotlin', 'xcode', 'expo'],
  Security: ['security', 'pentest', 'pentesting', 'vulnerability', 'cybersecurity', 'secrets', 'osint', 'ctf', 'malware', 'audit', 'appsec']
};
const CAT_SETS = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, new Set(v)]));

function tokens(repo) {
  const text = [repo.name, repo.description, ...(repo.topics || [])].join(' ').toLowerCase();
  const words = text.split(/[^a-z0-9.+#]+/).filter(Boolean);
  // also split hyphenated topics so "game-dev-tools" counts as game, dev, tools
  const parts = (repo.topics || []).flatMap(t => [t, ...t.split('-')]);
  return new Set([...words, ...parts, ...(repo.topics || [])]);
}

function categorize(repo) {
  const tk = tokens(repo);
  const scored = Object.entries(CAT_SETS)
    .map(([cat, set]) => [cat, [...set].filter(w => tk.has(w)).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  return scored.length ? scored.slice(0, 3).map(([c]) => c) : ['General'];
}

function kindOf(repo) {
  const tk = tokens(repo);
  const name = repo.name.toLowerCase();
  if (name.startsWith('awesome') || tk.has('awesome') || tk.has('awesome-list')) return 'Awesome list';
  if (tk.has('skill') || tk.has('skills') || tk.has('agent-skills') || tk.has('claude-skills')) return 'Skill';
  if (tk.has('plugin') || tk.has('plugins') || tk.has('extension') || tk.has('marketplace')) return 'Plugin';
  if (tk.has('mcp') || tk.has('mcp-server') || tk.has('model-context-protocol') || /\bmcp\b/i.test(repo.description || '')) return 'MCP server';
  if (tk.has('subagents') || tk.has('subagent') || tk.has('agents') || tk.has('agent') || tk.has('ai-agents')) return 'Agent';
  if (tk.has('rules') || tk.has('prompts') || tk.has('prompt') || tk.has('cursor-rules') || tk.has('prompt-engineering')) return 'Prompts & rules';
  return 'Tool';
}

const looksLikeAI = repo => {
  const tk = tokens(repo);
  return ['claude', 'claude-code', 'mcp', 'llm', 'ai', 'agent', 'agents', 'codex', 'cursor', 'gpt', 'openai', 'anthropic', 'gemini', 'copilot', 'skills', 'prompt', 'prompts', 'model-context-protocol', 'chatgpt', 'ollama']
    .some(w => tk.has(w));
};

// ── run ──
const history = existsSync(HISTORY) ? JSON.parse(await readFile(HISTORY, 'utf8')) : {};
const curated = existsSync(CURATED) ? JSON.parse(await readFile(CURATED, 'utf8')) : { repos: [] };
const found = new Map();

const qs = queries();
console.log(`${qs.length} searches${token ? '' : ' (no token — slow mode)'}…`);
for (const [i, q] of qs.entries()) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q + ' archived:false fork:false')}&sort=stars&order=desc&per_page=100`;
  try {
    const j = await gh(url);
    for (const r of j?.items || []) found.set(r.full_name, r);
    process.stdout.write(`\r  ${i + 1}/${qs.length} · ${found.size} repos`);
  } catch (err) {
    console.warn(`\n  query failed: ${q} — ${err.message.slice(0, 120)}`);
  }
  await sleep(SEARCH_GAP);
}
console.log();

for (const c of curated.repos) {
  const name = c.repo || c;
  if (found.has(name)) continue;
  const r = await gh(`https://api.github.com/repos/${name}`).catch(() => null);
  if (r) found.set(r.full_name, r);
  await sleep(300);
}
const curatedNotes = new Map(curated.repos.map(c => [c.repo || c, c.note]));

const today = day();
const repos = [];
for (const r of found.values()) {
  if (r.archived || r.fork || r.disabled) continue;
  const isCurated = curatedNotes.has(r.full_name);
  if (!isCurated && (!r.description || !looksLikeAI(r))) continue;

  const h = (history[r.full_name] ||= {});
  h[today] = r.stargazers_count;

  // Growth over the last 7 days, or as much history as we have.
  const dates = Object.keys(h).sort();
  const base = [...dates].reverse().find(d => d <= daysAgo(7)) || dates[0];
  const windowDays = Math.max(0, Math.round((Date.parse(today) - Date.parse(base)) / 864e5));
  const gained = r.stargazers_count - h[base];
  const ageDays = Math.max(1, (Date.now() - Date.parse(r.created_at)) / 864e5);
  const lifetimeRate = r.stargazers_count / ageDays;
  // Stars per day: measured if we have ≥1 day of history, otherwise lifetime average.
  const rate = windowDays >= 1 ? gained / windowDays : lifetimeRate;

  repos.push({
    name: r.name,
    owner: r.owner.login,
    full_name: r.full_name,
    url: r.html_url,
    description: (r.description || '').slice(0, 300),
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    topics: (r.topics || []).slice(0, 8),
    created_at: r.created_at,
    pushed_at: r.pushed_at,
    kind: kindOf(r),
    categories: categorize(r),
    gained: windowDays >= 1 ? gained : null,
    gainedDays: windowDays,
    rate: Math.round(rate * 10) / 10,
    rateMeasured: windowDays >= 1,
    isNew: ageDays <= 30,
    curated: isCurated || undefined,
    note: curatedNotes.get(r.full_name)
  });
}

repos.sort((a, b) => b.rate - a.rate);
const kept = repos.slice(0, MAX_REPOS);

// Prune history to repos we still track, and to the last N days.
const keepNames = new Set(kept.map(r => r.full_name));
const cutoff = daysAgo(HISTORY_DAYS);
for (const name of Object.keys(history)) {
  if (!keepNames.has(name)) { delete history[name]; continue; }
  for (const d of Object.keys(history[name])) if (d < cutoff) delete history[name][d];
}

await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), total: kept.length, repos: kept }, null, 1) + '\n');
await writeFile(HISTORY, JSON.stringify(history) + '\n');
console.log(`wrote ${kept.length} repos → data/repos.json`);
