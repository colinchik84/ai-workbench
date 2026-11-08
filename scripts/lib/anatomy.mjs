// Heuristics shared by the prompt updater: split a prompt into phrases, label
// each phrase with the job it does, and guess the model family and subject.

const ROLE_WORDS = {
  camera: [
    'lens', /\d+\s?mm\b/i, /\bf\/\d/i, 'aperture', 'depth of field', 'bokeh', 'close-up', 'closeup', 'close up', 'wide-angle', 'wide angle',
    'macro', 'shot on', 'shot with', 'angle', 'overhead', 'aerial', 'drone', 'telephoto', 'full body', 'full-body', 'half body',
    'three-quarter', 'eye level', 'eye-level', 'tilt-shift', 'dslr', 'canon', 'nikon', 'sony', 'fujifilm', 'leica', 'hasselblad',
    'framing', 'focus', 'pov', 'from above', 'from below', 'flat-lay', 'flat lay', 'top-down', 'medium shot', 'wide shot', 'portrait shot'
  ],
  light: [
    'light', 'lighting', 'lit', 'sunlight', 'sunset', 'sunrise', 'golden hour', 'blue hour', 'dawn', 'dusk', 'shadow', 'shadows',
    'glow', 'glowing', 'rim', 'backlit', 'backlight', 'neon', 'volumetric', 'god rays', 'softbox', 'moonlight', 'candlelight',
    'chiaroscuro', 'low-key', 'high-key', 'reflections', 'reflecting', 'night', 'overcast', 'haze', 'fog', 'mist'
  ],
  style: [
    'style', 'art', 'artwork', 'painting', 'painted', 'illustration', 'photo', 'photograph', 'photography', 'render', '3d', 'octane',
    'unreal engine', 'anime', 'manga', 'watercolor', 'watercolour', 'oil', 'vector', 'concept art', 'digital', 'realistic',
    'photorealistic', 'hyperrealistic', 'masterpiece', 'best quality', 'editorial', 'cinematic', 'film still', 'sketch', 'ink',
    'pixel art', 'isometric', 'aesthetic', 'risograph', 'poster', 'by ', 'studio ghibli', 'pixar', 'claymation', 'lineart',
    'cel shaded', 'cel-shaded', 'film grain', 'kodak', 'portra', 'polaroid', 'magazine', 'vintage', 'retro', 'surreal', 'score_'
  ],
  mood: [
    'palette', 'color', 'colors', 'colour', 'colours', 'tones', 'toned', 'mood', 'moody', 'atmosphere', 'atmospheric', 'dreamy',
    'melancholic', 'melancholy', 'vibrant', 'pastel', 'muted', 'warm', 'cool', 'serene', 'ethereal', 'whimsical', 'cozy', 'cosy',
    'eerie', 'dramatic', 'calm', 'peaceful', 'nostalgic', 'gloomy', 'playful', 'saturated', 'desaturated', 'monochrome'
  ],
  format: [
    'aspect', 'ratio', 'vertical', 'horizontal', 'square', 'composition', 'centered', 'centred', 'symmetrical', 'rule of thirds',
    'background', 'negative space', 'wallpaper', '4k', '8k', 'high resolution', 'highres', 'absurdres', 'highly detailed',
    'ultra detailed', 'intricate', 'sharp', 'minimal', 'minimalist', 'character sheet', 'turnaround', 'no text'
  ]
};
const ROLE_ORDER = ['camera', 'light', 'format', 'mood', 'style'];

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ROLE_RES = Object.fromEntries(
  Object.entries(ROLE_WORDS).map(([role, words]) => [
    role,
    words.map(w => w instanceof RegExp ? w : new RegExp(
      (/^\w/.test(w) ? '\\b' : '') + escapeRe(w) + (/\w$/.test(w) && !w.endsWith('_') ? '\\b' : ''), 'i'
    ))
  ])
);

function roleFor(phrase, index, total) {
  if (/(^|\s)--\w+/.test(phrase)) return 'params';
  if (/\b\d{1,2}:\d{1,2}\b/.test(phrase) && phrase.length < 40) return 'format';
  let best = null, bestScore = 0;
  for (const role of ROLE_ORDER) {
    const score = ROLE_RES[role].reduce((n, re) => n + (re.test(phrase) ? 1 : 0), 0);
    if (score > bestScore) { best = role; bestScore = score; }
  }
  // Long descriptive phrases that only brush a keyword are still mostly subject.
  const words = phrase.split(/\s+/).length;
  if (best && words > 14 && bestScore === 1) best = null;
  if (best) return best;
  return index < Math.max(2, total * 0.5) || words > 4 ? 'subject' : 'other';
}

/** Split a prompt into [text, role] pairs. Midjourney-style --params are kept as one tail segment. */
export function segmentPrompt(prompt) {
  let text = prompt.replace(/\s+/g, ' ').trim();
  let params = '';
  const p = text.search(/\s--[a-z]+/i);
  if (p > 0) { params = text.slice(p).trim(); text = text.slice(0, p).trim(); }

  const phrases = text.split(/(?<=[,.;:!?])\s+|\s+(?=BREAK\b)/).filter(Boolean);
  // Merge tiny fragments (single tags like "1girl,") into their neighbour so the
  // colour bands stay readable.
  const merged = [];
  for (const ph of phrases) {
    const last = merged[merged.length - 1];
    if (last && ph.length < 14 && last.length < 60 && roleFor(ph, 0, 99) === roleFor(last, 0, 99)) {
      merged[merged.length - 1] = last + ' ' + ph;
    } else merged.push(ph);
  }
  const segs = merged.map((ph, i) => [ph, roleFor(ph, i, merged.length)]);
  if (params) segs.push([params, 'params']);
  return segs;
}

export const FAMILIES = [
  { id: 'nano-banana', name: 'Nano Banana (Gemini Image)', re: /nano[\s-]?banana|gemini[\s-]?(2\.5|3)?[\s-]?(flash|pro)?[\s-]?image|#gemini/i },
  { id: 'gpt-image', name: 'GPT Image', re: /^\s*openai\b|gpt[\s-]?image|gpt-?4o|chatgpt|sora image|dall[\s·-]?e|#gptimage|#chatgpt/i },
  { id: 'midjourney', name: 'Midjourney', re: /midjourney|#mj\b|--niji|--sref|--stylize|--v\s?\d/i },
  { id: 'flux', name: 'FLUX', re: /\bflux|black forest|kontext/i },
  { id: 'ideogram', name: 'Ideogram', re: /ideogram/i },
  { id: 'imagen', name: 'Imagen', re: /\bimagen/i },
  { id: 'seedream', name: 'Seedream', re: /seedream|seededit/i },
  { id: 'qwen-image', name: 'Qwen Image', re: /qwen/i },
  { id: 'krea', name: 'Krea', re: /\bkrea/i },
  { id: 'hidream', name: 'HiDream', re: /hidream/i },
  { id: 'sdxl', name: 'Stable Diffusion / SDXL', re: /sdxl|sd\s?1\.5|sd\s?3|stable diffusion|pony|illustrious|noobai|#stablediffusion/i }
];

export function detectFamily(...texts) {
  const t = texts.filter(Boolean).join(' ');
  for (const f of FAMILIES) if (f.re.test(t)) return f;
  return null;
}

const SUBJECTS = [
  ['Poster & type', /\b(poster|logo|typography|lettering|wordmark|label reads|text that says|font|signage|book cover|album cover)\b/i],
  ['Product', /\b(product (shot|photo)|bottle|packaging|sneaker|watch|headphones|perfume|cosmetic|commercial|advert|on a plinth|podium)\b/i],
  ['Food', /\b(food|dish|bowl of|plate of|ramen|sushi|burger|pizza|cake|coffee|cocktail|dessert|bread)\b/i],
  ['Architecture', /\b(architecture|architectural|interior|building|house|room|cathedral|skyscraper|library|facade|living room)\b/i],
  ['3D & miniature', /\b(isometric|diorama|miniature|tilt-shift|claymation|3d render|low poly|voxel|figurine|toy)\b/i],
  ['Character', /\b(character sheet|turnaround|mascot|creature|monster|robot|knight|warrior|chibi|dragon)\b/i],
  ['Landscape', /\b(landscape|mountain|forest|ocean|beach|desert|valley|waterfall|sky|lake|canyon|cityscape|skyline)\b/i],
  ['Portrait', /\b(portrait|woman|man|girl|boy|face|headshot|selfie|person|lady|old man|child)\b/i],
  ['Illustration', /\b(illustration|anime|manga|painting|watercolou?r|cartoon|comic|drawing|sketch)\b/i]
];
export function detectSubject(prompt) {
  for (const [name, re] of SUBJECTS) if (re.test(prompt)) return name;
  return 'Other';
}

// Keep the gallery work-safe: drop anything that trips this list.
const BLOCK = /\b(nsfw|nude|nudity|naked|topless|sexy|seductive|erotic|lingerie|underwear|panties|bra\b|bikini|cleavage|breasts?|nipples?|thighs|butt|ass\b|buttocks|loli|shota|gore|blood|corpse|fetish|bdsm|hentai|onlyfans|porn)/i;
export const isSafe = text => !BLOCK.test(text || '');

export const tidy = s => (s || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
