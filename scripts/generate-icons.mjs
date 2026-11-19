// Genera los iconos PNG de la PWA a partir de un diseño SVG.
// Uso: npm run icons
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pub = path.join(root, 'public');

/**
 * Icono de Nexo: squircle con degradado de cristal y tres capas escalonadas
 * (día → semana → mes) conectadas en cascada.
 * @param {{ squircle: boolean, scale: number }} opts
 *   squircle → esquinas redondeadas transparentes (favicon / icono "any").
 *   scale    → escala del motivo central (los maskable necesitan zona segura).
 */
function iconSvg({ squircle, scale }) {
  const S = 1024;
  const c = S / 2;
  const t = (v) => c + (v - c) * scale; // escala alrededor del centro
  const bg = squircle
    ? `<path d="M512 0C788 0 924 0 974 50S1024 236 1024 512 1024 924 974 974 788 1024 512 1024 100 1024 50 974 0 788 0 512 0 100 50 50 236 0 512 0Z" fill="url(#bg)"/>`
    : `<rect width="1024" height="1024" fill="url(#bg)"/>`;
  const clip = squircle
    ? `<clipPath id="clip"><path d="M512 0C788 0 924 0 974 50S1024 236 1024 512 1024 924 974 974 788 1024 512 1024 100 1024 50 974 0 788 0 512 0 100 50 50 236 0 512 0Z"/></clipPath>`
    : `<clipPath id="clip"><rect width="1024" height="1024"/></clipPath>`;

  // Tres capas de cristal escalonadas (x, y, ancho)
  const layers = [
    { x: 236, y: 268, w: 420, o: 0.95 },
    { x: 318, y: 446, w: 420, o: 0.8 },
    { x: 400, y: 624, w: 388, o: 0.66 },
  ];
  const h = 132;
  const r = 66;
  const layerSvg = layers
    .map(({ x, y, w, o }, i) => {
      const X = t(x), Y = t(y), W = w * scale, H = h * scale, R = r * scale;
      return `
    <g opacity="${o}">
      <rect x="${X}" y="${Y + 18 * scale}" width="${W}" height="${H}" rx="${R}" fill="#0b1030" opacity="0.35" filter="url(#soft)"/>
      <rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${R}" fill="url(#glass${i})"/>
      <rect x="${X + 1.5}" y="${Y + 1.5}" width="${W - 3}" height="${H - 3}" rx="${R - 1.5}" fill="none" stroke="url(#rim)" stroke-width="${3 * scale}"/>
      <rect x="${X + 28 * scale}" y="${Y + 20 * scale}" width="${W - 56 * scale}" height="${22 * scale}" rx="${11 * scale}" fill="#fff" opacity="0.32"/>
    </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    ${clip}
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2a6b"/>
      <stop offset="0.48" stop-color="#3a2a8f"/>
      <stop offset="1" stop-color="#0a0f2a"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.22" cy="0.18" r="0.7">
      <stop offset="0" stop-color="#6fd3ff" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#6fd3ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.85" cy="0.9" r="0.65">
      <stop offset="0" stop-color="#b06bff" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#b06bff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="glass0" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="1" stop-color="#bfe8ff" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="glass1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e3f4ff" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#9fb8ff" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="glass2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9ccff" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#a77bff" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${22 * scale}"/></filter>
  </defs>
  <g clip-path="url(#clip)">
    ${bg}
    <rect width="1024" height="1024" fill="url(#glowA)"/>
    <rect width="1024" height="1024" fill="url(#glowB)"/>
    ${layerSvg}
    <rect width="1024" height="1024" fill="url(#sheen)"/>
  </g>
</svg>`;
}

async function main() {
  await mkdir(pub, { recursive: true });

  const favicon = iconSvg({ squircle: true, scale: 1 });
  const full = iconSvg({ squircle: false, scale: 1 });
  const maskable = iconSvg({ squircle: false, scale: 0.78 });

  await writeFile(path.join(pub, 'icon.svg'), favicon);

  const jobs = [
    // iOS aplica su propia máscara: fondo completo y sin transparencia.
    { svg: full, size: 180, file: 'apple-touch-icon.png', flatten: true },
    { svg: favicon, size: 192, file: 'icon-192.png' },
    { svg: favicon, size: 512, file: 'icon-512.png' },
    { svg: maskable, size: 512, file: 'icon-512-maskable.png', flatten: true },
  ];

  for (const { svg, size, file, flatten } of jobs) {
    let img = sharp(Buffer.from(svg), { density: 300 }).resize(size, size);
    if (flatten) img = img.flatten({ background: '#1b2a6b' });
    await img.png({ compressionLevel: 9 }).toFile(path.join(pub, file));
    console.log(`✓ public/${file} (${size}×${size})`);
  }
  console.log('✓ public/icon.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
