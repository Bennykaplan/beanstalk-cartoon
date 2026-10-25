import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STYLES, EXAGGERATION, PALETTES, OUTLINES, OUTFITS, GLOWUPS, SCENES,
  cartoonifyPrompt, scenePrompt,
} from './prompts.js';

// Local runs read .env; on Render the key comes from the dashboard's environment settings.
const DIR = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(path.join(DIR, '.env')); } catch { /* no .env file */ }

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
const RATE_LIMIT_PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR || 12);
const PORT = process.env.PORT || 3010;

if (!API_KEY) console.warn('GEMINI_API_KEY is not set; generation requests will fail.');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(DIR, 'public')));

app.get('/healthz', (_req, res) => res.send('ok'));

app.get('/api/scenes', (_req, res) => {
  res.json(Object.fromEntries(Object.entries(SCENES).map(([k, v]) => [k, { title: v.title, caption: v.spec }])));
});

// Simple in-memory per-IP limiter so a public URL can't drain the balance.
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < 3600_000);
  if (recent.length >= RATE_LIMIT_PER_HOUR) {
    return res.status(429).json({ error: 'Hourly generation limit reached. Try again later.' });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) throw new Error('Expected a JPEG, PNG or WebP image.');
  return { mime_type: m[1], data: m[2] };
}

function parseSettings(s = {}) {
  const pick = (table, value, fallback) => (Object.hasOwn(table, value) ? value : fallback);
  return {
    style: pick(STYLES, s.style, 'anime'),
    exaggeration: pick(EXAGGERATION, String(s.exaggeration), '1'),
    palette: pick(PALETTES, s.palette, 'vibrant'),
    outline: pick(OUTLINES, s.outline, 'thin'),
    outfit: pick(OUTFITS, s.outfit, 'own'),
    glowup: pick(GLOWUPS, s.glowup, 'off'),
  };
}

// Exactly one request per user action: no retries, no loops.
async function generateImage(prompt, images, aspectRatio) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, ...images.map((img) => ({ inline_data: img }))] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } },
      }),
    },
  );
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error?.message || `Gemini returned HTTP ${r.status}`);
  const parts = body.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData || p.inline_data);
  if (!img) {
    const why = parts.find((p) => p.text)?.text || body.candidates?.[0]?.finishReason || 'no image returned';
    throw new Error(`The model did not return an image (${why}).`);
  }
  const { mimeType, mime_type, data } = img.inlineData || img.inline_data;
  return `data:${mimeType || mime_type};base64,${data}`;
}

app.post('/api/cartoonify', rateLimit, async (req, res) => {
  try {
    const photo = parseDataUrl(req.body.photo);
    const settings = parseSettings(req.body.settings);
    const image = await generateImage(cartoonifyPrompt(settings), [photo], '3:4');
    res.json({ image });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post('/api/scene', rateLimit, async (req, res) => {
  try {
    const scene = SCENES[req.body.scene];
    if (!scene) return res.status(400).json({ error: 'Unknown scene.' });
    const cartoon = parseDataUrl(req.body.cartoon);
    const photo = parseDataUrl(req.body.photo);
    const settings = parseSettings(req.body.settings);
    const image = await generateImage(scenePrompt(settings, req.body.scene), [cartoon, photo], '4:3');
    res.json({ image, caption: scene.spec });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT} (model ${MODEL})`));
