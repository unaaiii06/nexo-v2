// Motor de temas: cada tema es un conjunto de «tokens» (variables CSS) que se aplican
// en <html>. La personalización (acento, fuente, esquinas, cristal, fondo, animaciones)
// se aplica encima del tema elegido.

const DARK = {
  scheme: 'dark',
  fg: '245 245 247',
  danger: '255 69 58',
  warn: '255 159 10',
  ok: '48 209 88',
  prioHigh: '#ff453a',
  prioMedium: '#ff9f0a',
  prioLow: '#64d2ff',
  tint: '22 22 26',
  panelAlpha: 0.65,
  card: 'rgba(255, 255, 255, 0.045)',
  cardHover: 'rgba(255, 255, 255, 0.075)',
  field: 'rgba(255, 255, 255, 0.06)',
  hairline: 'rgba(255, 255, 255, 0.12)',
  hairlineStrong: 'rgba(255, 255, 255, 0.18)',
  specular: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  shadow: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.28), 0 24px 64px rgba(0,0,0,0.3)',
  blur: 24,
  scrim: 'rgba(0, 0, 0, 0.5)',
  now: '#ff453a',
  onAccent: '#ffffff',
  ambBase: 'linear-gradient(transparent, transparent)',
  glow: 'transparent',
  animated: false,
};

const LIGHT = {
  ...DARK,
  scheme: 'light',
  fg: '29 29 31',
  danger: '255 59 48',
  warn: '214 118 0',
  ok: '36 158 70',
  prioHigh: '#ff3b30',
  prioMedium: '#ff9500',
  prioLow: '#32ade6',
  tint: '255 255 255',
  panelAlpha: 0.72,
  card: 'rgba(255, 255, 255, 0.62)',
  cardHover: 'rgba(255, 255, 255, 0.9)',
  field: 'rgba(0, 0, 0, 0.045)',
  hairline: 'rgba(0, 0, 0, 0.08)',
  hairlineStrong: 'rgba(0, 0, 0, 0.12)',
  specular: 'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  shadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(30,40,80,0.06), 0 24px 64px rgba(30,40,80,0.08)',
  scrim: 'rgba(20, 20, 30, 0.25)',
  now: '#ff3b30',
};

const t = (base, o) => ({ ...base, ...o });

export const THEMES = [
  t(DARK, {
    id: 'obsidian', name: 'Obsidian Glass', hint: 'Oscuro pro', group: 'Oscuros',
    bg: '#070709', accent: '10 132 255', accent2: '191 90 242',
    amb: ['rgba(30,58,160,0.45)', 'rgba(88,40,150,0.38)', 'rgba(10,132,255,0.14)'],
  }),
  t(DARK, {
    id: 'titanium', name: 'Titanium Dusk', hint: 'Oscuro cálido', group: 'Oscuros',
    bg: '#141413', fg: '242 236 226', accent: '226 178 102', accent2: '204 150 92', onAccent: '#1a1408',
    tint: '36 33 30', panelAlpha: 0.62, blur: 28,
    card: 'rgba(255,240,220,0.045)', cardHover: 'rgba(255,240,220,0.08)', field: 'rgba(255,240,220,0.06)',
    hairline: 'rgba(255,236,210,0.12)', hairlineStrong: 'rgba(255,236,210,0.2)', specular: 'inset 0 1px 0 rgba(255,236,210,0.12)',
    prioHigh: '#ff6a50', prioMedium: '#e8b062', prioLow: '#a8b8a0', now: '#ff6a50',
    amb: ['rgba(180,120,50,0.3)', 'rgba(120,90,60,0.32)', 'rgba(226,178,102,0.12)'],
  }),
  t(DARK, {
    id: 'ocean', name: 'Océano Profundo', hint: 'Azul abisal', group: 'Oscuros',
    bg: '#04121a', fg: '232 246 250', accent: '45 212 230', accent2: '56 128 255', onAccent: '#032028',
    tint: '8 30 42', panelAlpha: 0.6,
    amb: ['rgba(0,140,170,0.42)', 'rgba(20,70,160,0.4)', 'rgba(45,212,230,0.16)'],
  }),
  t(DARK, {
    id: 'forest', name: 'Bosque', hint: 'Verde musgo', group: 'Oscuros',
    bg: '#0a120c', fg: '236 244 234', accent: '134 214 110', accent2: '214 196 96', onAccent: '#0d1f0a',
    tint: '20 32 22', panelAlpha: 0.62,
    card: 'rgba(220,255,210,0.045)', field: 'rgba(220,255,210,0.06)', hairline: 'rgba(210,255,200,0.12)',
    amb: ['rgba(40,120,60,0.38)', 'rgba(110,130,40,0.3)', 'rgba(134,214,110,0.12)'],
  }),
  t(DARK, {
    id: 'graphite', name: 'Grafito', hint: 'Monocromo minimal', group: 'Oscuros',
    bg: '#101011', fg: '238 238 240', accent: '238 238 240', accent2: '150 150 160', onAccent: '#111113',
    tint: '28 28 30', panelAlpha: 0.9, blur: 12,
    prioHigh: '#f2f2f4', prioMedium: '#a8a8b0', prioLow: '#6a6a72',
    amb: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.04)'],
  }),
  t(DARK, {
    id: 'cyber', name: 'Neón Cyber', hint: 'Rosa y cian eléctricos', group: 'Vivos',
    bg: '#07040f', fg: '246 240 255', accent: '255 46 160', accent2: '0 229 255',
    tint: '20 10 36', panelAlpha: 0.6,
    hairline: 'rgba(255,90,200,0.2)', hairlineStrong: 'rgba(0,229,255,0.3)', specular: 'inset 0 1px 0 rgba(255,120,220,0.18)',
    amb: ['rgba(255,46,160,0.35)', 'rgba(0,229,255,0.28)', 'rgba(120,40,255,0.3)'],
    glow: 'rgba(0,229,255,0.35)', animated: true,
  }),
  t(DARK, {
    id: 'vision', name: 'Vision Spatial', hint: 'Translúcido ambiental', group: 'Vivos',
    bg: '#0b0a1a', fg: '255 255 255', accent: '120 200 255', accent2: '230 140 255', onAccent: '#0b0a1a',
    tint: '255 255 255', panelAlpha: 0.1, panelStrong: 'rgba(40, 36, 70, 0.78)', blur: 40,
    card: 'rgba(255,255,255,0.08)', cardHover: 'rgba(255,255,255,0.14)', field: 'rgba(255,255,255,0.1)',
    hairline: 'rgba(255,255,255,0.2)', hairlineStrong: 'rgba(255,255,255,0.3)', specular: 'inset 0 1px 0 rgba(255,255,255,0.28)',
    shadow: '0 2px 6px rgba(10,0,40,0.2), 0 18px 50px rgba(10,0,40,0.35)', scrim: 'rgba(5,0,25,0.45)',
    prioHigh: '#ff6b81', prioMedium: '#ffc15a', prioLow: '#8be8ff', now: '#ff6b81',
    amb: ['rgba(70,90,255,0.75)', 'rgba(200,70,220,0.6)', 'rgba(40,200,230,0.5)'],
    ambBase: 'linear-gradient(160deg, #13103a, #241046 50%, #071a33)', glow: 'rgba(255,120,200,0.45)', animated: true,
  }),
  t(DARK, {
    id: 'aurora', name: 'Aurora Boreal', hint: 'Luces del norte', group: 'Vivos',
    bg: '#050b12', fg: '236 252 246', accent: '80 240 170', accent2: '170 110 255', onAccent: '#04150e',
    tint: '255 255 255', panelAlpha: 0.08, panelStrong: 'rgba(16, 32, 40, 0.82)', blur: 36,
    card: 'rgba(255,255,255,0.07)', cardHover: 'rgba(255,255,255,0.12)', field: 'rgba(255,255,255,0.09)',
    hairline: 'rgba(200,255,230,0.18)', hairlineStrong: 'rgba(200,255,230,0.28)', specular: 'inset 0 1px 0 rgba(220,255,240,0.22)',
    amb: ['rgba(40,220,150,0.5)', 'rgba(140,80,255,0.45)', 'rgba(30,160,220,0.35)'],
    ambBase: 'linear-gradient(170deg, #061a1c, #0b0f26 55%, #050b12)', glow: 'rgba(80,240,170,0.35)', animated: true,
  }),
  t(DARK, {
    id: 'sunset', name: 'Atardecer', hint: 'Naranja y magenta', group: 'Vivos',
    bg: '#160810', fg: '255 244 236', accent: '255 138 76', accent2: '255 70 140', onAccent: '#2a0c06',
    tint: '255 255 255', panelAlpha: 0.09, panelStrong: 'rgba(52, 20, 30, 0.82)', blur: 36,
    card: 'rgba(255,255,255,0.07)', cardHover: 'rgba(255,255,255,0.12)', field: 'rgba(255,255,255,0.09)',
    hairline: 'rgba(255,220,200,0.2)', hairlineStrong: 'rgba(255,220,200,0.3)', specular: 'inset 0 1px 0 rgba(255,230,210,0.22)',
    amb: ['rgba(255,120,60,0.55)', 'rgba(230,50,130,0.5)', 'rgba(120,40,160,0.45)'],
    ambBase: 'linear-gradient(165deg, #3a1020, #200a2a 55%, #120612)', glow: 'rgba(255,170,90,0.4)', animated: true,
  }),
  t(LIGHT, {
    id: 'alabaster', name: 'Alabaster Frost', hint: 'Claro puro', group: 'Claros',
    bg: '#F5F5F7', accent: '0 113 227', accent2: '137 68 222',
    amb: ['rgba(120,190,255,0.45)', 'rgba(190,160,255,0.4)', 'rgba(255,210,230,0.35)'],
  }),
  t(LIGHT, {
    id: 'rose', name: 'Cuarzo Rosa', hint: 'Rosa suave', group: 'Claros',
    bg: '#FBF3F5', fg: '48 24 34', accent: '224 72 120', accent2: '170 100 220',
    card: 'rgba(255,255,255,0.65)', hairline: 'rgba(120,30,60,0.09)',
    amb: ['rgba(255,170,200,0.5)', 'rgba(230,190,255,0.42)', 'rgba(255,210,190,0.4)'],
  }),
  t(LIGHT, {
    id: 'lavender', name: 'Lavanda', hint: 'Lila sereno', group: 'Claros',
    bg: '#F4F2FB', fg: '34 28 56', accent: '108 84 230', accent2: '200 90 200',
    amb: ['rgba(170,150,255,0.45)', 'rgba(210,170,255,0.4)', 'rgba(160,210,255,0.35)'],
  }),
  t(LIGHT, {
    id: 'paper', name: 'Papel', hint: 'Crema editorial', group: 'Claros',
    bg: '#F6F1E7', fg: '44 36 26', accent: '176 98 40', accent2: '120 90 60',
    tint: '255 252 245', panelAlpha: 0.8, blur: 16,
    card: 'rgba(255,252,244,0.7)', cardHover: 'rgba(255,252,244,0.95)', field: 'rgba(60,40,10,0.05)',
    hairline: 'rgba(80,60,20,0.1)', hairlineStrong: 'rgba(80,60,20,0.16)',
    amb: ['rgba(230,200,150,0.35)', 'rgba(210,180,140,0.3)', 'rgba(240,220,180,0.3)'],
    font: 'serif',
  }),
];

export const THEME_GROUPS = ['Oscuros', 'Vivos', 'Claros'];

export const ACCENTS = [
  { id: null, name: 'Del tema' },
  { id: '#0A84FF', name: 'Azul' },
  { id: '#5E5CE6', name: 'Índigo' },
  { id: '#BF5AF2', name: 'Morado' },
  { id: '#FF375F', name: 'Rosa' },
  { id: '#FF453A', name: 'Rojo' },
  { id: '#FF9F0A', name: 'Naranja' },
  { id: '#FFD60A', name: 'Amarillo' },
  { id: '#30D158', name: 'Verde' },
  { id: '#00C7BE', name: 'Turquesa' },
  { id: '#64D2FF', name: 'Cian' },
  { id: '#AC8E68', name: 'Marrón' },
];

export const FONTS = {
  system: { name: 'Sistema', stack: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif" },
  rounded: { name: 'Redondeada', stack: "ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  serif: { name: 'Serif', stack: "ui-serif, 'New York', 'Iowan Old Style', Georgia, 'Times New Roman', serif" },
  mono: { name: 'Mono', stack: "ui-monospace, 'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace" },
};

export const CORNERS = { sharp: { name: 'Rectas', k: 0.4 }, normal: { name: 'Normales', k: 1 }, round: { name: 'Muy redondas', k: 1.35 } };
export const GLASS = { solid: { name: 'Sólido' }, normal: { name: 'Cristal' }, intense: { name: 'Intenso' } };
export const AMBIENT = { off: { name: 'Liso' }, static: { name: 'Luces' }, animated: { name: 'Animado' } };
export const MOTION = { full: { name: 'Completas' }, reduced: { name: 'Mínimas' } };

export const DEFAULT_CUSTOM = { accent: null, font: null, corners: 'normal', glass: 'normal', ambient: null, motion: 'full' };

/* ---------- Utilidades de color ---------- */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}
function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (!s) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
const luminance = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Calcula todas las variables CSS del tema + personalización */
export function buildTheme(themeId, custom = {}) {
  const base = THEMES.find((x) => x.id === themeId) || THEMES[0];
  const c = { ...DEFAULT_CUSTOM, ...custom };
  const th = { ...base };

  if (c.accent) {
    const rgb = hexToRgb(c.accent);
    const [h, s, l] = rgbToHsl(rgb);
    th.accent = rgb.join(' ');
    th.accent2 = hslToRgb([h + 38, Math.min(1, s * 0.95), Math.min(0.75, Math.max(0.45, l))]).join(' ');
    th.onAccent = luminance(rgb) > 0.62 ? '#111114' : '#ffffff';
  }

  let panelAlpha = th.panelAlpha;
  let blur = th.blur;
  let panelStrong = th.panelStrong || `rgba(${th.tint.replaceAll(' ', ', ')}, ${th.scheme === 'light' ? 0.9 : 0.86})`;
  if (c.glass === 'solid') {
    panelStrong = th.scheme === 'light' ? `rgba(${th.tint.replaceAll(' ', ', ')}, 0.98)` : panelStrong.replace(/[\d.]+\)$/, '0.98)');
    panelAlpha = 0.97;
    blur = 0;
  } else if (c.glass === 'intense') {
    panelAlpha = Math.max(0.05, panelAlpha * 0.7);
    blur = Math.round(blur * 1.7);
  }
  const solidTint = c.glass === 'solid' && th.tint === '255 255 255' && th.scheme === 'dark' ? null : th.tint;
  const panel = solidTint ? `rgba(${solidTint.replaceAll(' ', ', ')}, ${panelAlpha})` : panelStrong;

  const vars = {
    '--bg': th.bg,
    '--fg': th.fg,
    '--accent': th.accent,
    '--accent-2': th.accent2,
    '--danger': th.danger,
    '--warn': th.warn,
    '--ok': th.ok,
    '--prio-high': th.prioHigh,
    '--prio-medium': th.prioMedium,
    '--prio-low': th.prioLow,
    '--panel': panel,
    '--panel-strong': panelStrong,
    '--card': th.card,
    '--card-hover': th.cardHover,
    '--field': th.field,
    '--hairline': th.hairline,
    '--hairline-strong': th.hairlineStrong,
    '--specular': th.specular,
    '--shadow': th.shadow,
    '--blur': `${blur}px`,
    '--amb-1': th.amb[0],
    '--amb-2': th.amb[1],
    '--amb-3': th.amb[2],
    '--amb-base': th.ambBase,
    '--amb-glow': th.glow,
    '--scrim': th.scrim,
    '--now': th.now,
    '--on-accent': th.onAccent,
    '--font': FONTS[c.font || th.font || 'system'].stack,
    '--rk': String(CORNERS[c.corners]?.k ?? 1),
  };
  const ambient = c.ambient || (th.animated ? 'animated' : 'static');
  return { vars, scheme: th.scheme, meta: th.bg, ambient, motion: c.motion, theme: base };
}

const CACHE_KEY = 'nexo2:theme-vars';

/** Aplica el tema en <html> y lo guarda para pintarlo al instante en el próximo arranque */
export function applyTheme(themeId, custom) {
  const built = buildTheme(themeId, custom);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(built.vars)) root.style.setProperty(k, v);
  root.style.colorScheme = built.scheme;
  root.dataset.theme = built.theme.id;
  root.dataset.ambient = built.ambient;
  root.dataset.motion = built.motion;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', built.meta);
  // Logo del tema: pestaña del navegador y el icono que usará iOS al «Añadir a pantalla de inicio»
  document.querySelector('link[rel="icon"]')?.setAttribute('href', `./icons/${built.theme.id}.svg`);
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', `./icons/${built.theme.id}-180.png`);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ v: built.vars, s: built.scheme, a: built.ambient, m: built.motion, t: built.theme.id }));
  } catch {
    /* sin acceso */
  }
}

/** Fondo de muestra para las tarjetas de tema */
export function swatch(th) {
  return `radial-gradient(circle at 25% 25%, ${th.amb[0]}, transparent 60%), radial-gradient(circle at 80% 75%, ${th.amb[1]}, transparent 60%), radial-gradient(circle at 50% 100%, ${th.amb[2]}, transparent 60%), ${th.ambBase !== DARK.ambBase ? `${th.ambBase}, ` : ''}${th.bg}`;
}
