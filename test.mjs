// Usage: node test.mjs <photo> [style] [glowup on|off]
// Runs one cartoonify call and one call per scene against the local server, saving results to test-output/.
import fs from 'node:fs';
import path from 'node:path';

const [photoPath, style = 'storybook', glowup = 'off'] = process.argv.slice(2);
const base = process.env.BASE || `http://localhost:${process.env.PORT || 3010}`;
const name = `${path.parse(photoPath).name}-${style}${glowup === 'on' ? '-glowup' : ''}`;
const ext = path.extname(photoPath).slice(1).replace('jpg', 'jpeg');
const photo = `data:image/${ext};base64,${fs.readFileSync(photoPath).toString('base64')}`;
const settings = { style, exaggeration: 1, palette: 'vibrant', outline: 'thin', outfit: 'jack', glowup };

async function post(url, body) {
  const r = await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error);
  return j;
}
const save = (file, dataUrl) => {
  fs.writeFileSync(`test-output/${file}`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('saved', `test-output/${file}`);
};

fs.mkdirSync('test-output', { recursive: true });
const { image: cartoon } = await post('/api/cartoonify', { photo, settings });
save(`${name}-cartoon.png`, cartoon);
const planting = await post('/api/scene', { scene: 'planting', cartoon, photo, settings });
save(`${name}-planting.png`, planting.image);
const climbing = await post('/api/scene', { scene: 'climbing', cartoon, photo, settings });
save(`${name}-climbing.png`, climbing.image);
