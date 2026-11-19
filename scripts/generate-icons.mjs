// Genera el logo «NE» de Nexo: una versión por cada tema + los iconos de la PWA.
// Uso: npm run icons
//
// Monograma: la N y la E comparten el trazo vertical central (ligadura).
//   ┃╲ ┃━━━
//   ┃ ╲┃━━
//   ┃  ╲━━━
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from '../src/lib/themes.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pub = path.join(root, 'public');
const iconsDir = path.join(pub, 'icons');

// Squircle continuo tipo iOS (1024×1024)
const SQUIRCLE = 'M512 0C788 0 924 0 974 50S1024 236 1024 512 1024 924 974 974 788 1024 512 1024 100 1024 50 974 0 788 0 512 0 100 50 50 236 0 512 0Z';

const rgb = (triplet, a = 1) => `rgba(${triplet.replaceAll(' ', ', ')}, ${a})`;

/** Trazos del monograma NE, escalados alrededor del centro */
function glyph(scale = 1) {
  const c = 512;
  const p = (x, y) => `${(c + (x - c) * scale).toFixed(1)} ${(c + (y - c) * scale).toFixed(1)}`;
  // Silueta única (unión de N y E) para que no haya costuras entre trazos
  const pts = [
    [262, 300], [336, 300], [486, 583.9], [486, 300], [772, 300], [772, 370], [560, 370],
    [560, 477], [724, 477], [724, 547], [560, 547], [560, 654], [772, 654], [772, 724],
    [486, 724], [336, 440], [336, 724], [262, 724],
  ];
  return `M${pts.map(([x, y]) => p(x, y)).join('L')}Z`;
}

function iconSvg(t, { shape = 'squircle', scale = 1 } = {}) {
  const light = t.scheme === 'light';
  const accent = rgb(t.accent);
  const accent2 = rgb(t.accent2);
  // Fondo: el color del tema con luces de sus colores ambientales
  const bgA = light ? '#ffffff' : t.bg;
  const bgB = t.bg;
  const letterTop = light ? rgb(t.accent) : '#ffffff';
  const letterBottom = light ? rgb(t.accent2) : rgb(t.accent, 0.92);
  const rim = light ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)';
  const shadow = light ? 'rgba(40,30,60,0.22)' : 'rgba(0,0,0,0.55)';
  const clip = shape === 'squircle' ? `<path d="${SQUIRCLE}"/>` : '<rect width="1024" height="1024"/>';
  const bgShape = shape === 'squircle' ? `<path d="${SQUIRCLE}" fill="url(#bg)"/>` : '<rect width="1024" height="1024" fill="url(#bg)"/>';
  const d = glyph(scale);
  const sw = 26 * scale; // trazo para redondear las esquinas del monograma

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <clipPath id="clip">${clip}</clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgA}"/>
      <stop offset="1" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="g1" cx="0.18" cy="0.12" r="0.75"><stop offset="0" stop-color="${t.amb[0]}"/><stop offset="1" stop-color="${t.amb[0]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0.92" cy="0.95" r="0.7"><stop offset="0" stop-color="${t.amb[1]}"/><stop offset="1" stop-color="${t.amb[1]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g3" cx="0.85" cy="0.1" r="0.55"><stop offset="0" stop-color="${accent}" stop-opacity="${light ? 0.22 : 0.35}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <linearGradient id="letters" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${letterTop}"/>
      <stop offset="1" stop-color="${letterBottom}"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${rim}"/>
      <stop offset="0.5" stop-color="${rim}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="${light ? 0.5 : 0.16}"/>
      <stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="accentBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent2}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${22 * scale}"/></filter>
  </defs>
  <g clip-path="url(#clip)">
    ${bgShape}
    <rect width="1024" height="1024" fill="url(#g1)"/>
    <rect width="1024" height="1024" fill="url(#g2)"/>
    <rect width="1024" height="1024" fill="url(#g3)"/>
    <!-- sombra suave del monograma -->
    <path d="${d}" fill="${shadow}" stroke="${shadow}" stroke-width="${sw}" stroke-linejoin="round" transform="translate(0 ${18 * scale})" filter="url(#soft)"/>
    <!-- monograma NE -->
    <path d="${d}" fill="url(#letters)" stroke="url(#letters)" stroke-width="${sw}" stroke-linejoin="round"/>
    <!-- brillo especular sobre las letras -->
    <path d="${d}" fill="url(#rim)" opacity="0.35"/>
    <!-- detalle de acento: el brazo central de la E -->
    <path d="M${512 + (572 - 512) * scale} ${512 + (477 - 512) * scale}h${(724 - 572) * scale}v${70 * scale}h${-(724 - 572) * scale}Z" fill="url(#accentBar)" stroke="url(#accentBar)" stroke-width="${sw * 0.6}" stroke-linejoin="round" opacity="${light ? 0.95 : 0.9}"/>
    <rect width="1024" height="1024" fill="url(#sheen)"/>
  </g>
</svg>`;
}

async function png(svg, size, file, flatten) {
  let img = sharp(Buffer.from(svg), { density: 200 }).resize(size, size);
  if (flatten) img = img.flatten({ background: flatten });
  await img.png({ compressionLevel: 9 }).toFile(file);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  // Un icono por tema: SVG (logo en la app y favicon) + PNG 180 (pantalla de inicio de iOS)
  for (const t of THEMES) {
    await writeFile(path.join(iconsDir, `${t.id}.svg`), iconSvg(t));
    await png(iconSvg(t, { shape: 'square' }), 180, path.join(iconsDir, `${t.id}-180.png`), t.bg);
    console.log(`✓ icons/${t.id}.svg + icons/${t.id}-180.png`);
  }

  // Iconos por defecto de la PWA (tema Obsidian)
  const base = THEMES.find((t) => t.id === 'obsidian');
  await writeFile(path.join(pub, 'icon.svg'), iconSvg(base));
  await png(iconSvg(base, { shape: 'square' }), 180, path.join(pub, 'apple-touch-icon.png'), base.bg);
  await png(iconSvg(base), 192, path.join(pub, 'icon-192.png'));
  await png(iconSvg(base), 512, path.join(pub, 'icon-512.png'));
  await png(iconSvg(base, { shape: 'square', scale: 0.8 }), 512, path.join(pub, 'icon-512-maskable.png'), base.bg);
  console.log('✓ icon.svg, apple-touch-icon.png, icon-192/512(-maskable).png');

  // Hoja de contacto con todos los iconos (para revisarlos de un vistazo)
  const cols = 5, cell = 220, gap = 24;
  const rows = Math.ceil(THEMES.length / cols);
  const W = cols * cell + (cols + 1) * gap, H = rows * cell + (rows + 1) * gap;
  const composites = await Promise.all(
    THEMES.map(async (t, i) => ({
      input: await sharp(Buffer.from(iconSvg(t)), { density: 120 }).resize(cell, cell).png().toBuffer(),
      left: gap + (i % cols) * (cell + gap),
      top: gap + Math.floor(i / cols) * (cell + gap),
    })),
  );
  const out = process.env.ICON_SHEET || path.join(root, 'icon-sheet.png');
  await sharp({ create: { width: W, height: H, channels: 4, background: '#808088' } }).composite(composites).png().toFile(out);
  console.log(`✓ hoja de muestra: ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
