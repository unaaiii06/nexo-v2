export const THEMES = [
  {
    id: 'obsidian',
    name: 'Obsidian Glass',
    hint: 'Oscuro pro',
    meta: '#070709',
    swatch: 'radial-gradient(circle at 30% 25%, #2a3c9a, transparent 60%), radial-gradient(circle at 80% 80%, #4b2a8a, transparent 60%), #070709',
  },
  {
    id: 'alabaster',
    name: 'Alabaster Frost',
    hint: 'Claro puro',
    meta: '#F5F5F7',
    swatch: 'radial-gradient(circle at 25% 25%, #b9dcff, transparent 60%), radial-gradient(circle at 80% 80%, #dccfff, transparent 60%), #f5f5f7',
  },
  {
    id: 'titanium',
    name: 'Titanium Dusk',
    hint: 'Oscuro cálido',
    meta: '#141413',
    swatch: 'radial-gradient(circle at 30% 25%, #8a6a3a, transparent 60%), radial-gradient(circle at 80% 80%, #5a4a3a, transparent 60%), #141413',
  },
  {
    id: 'vision',
    name: 'Vision Spatial',
    hint: 'Translúcido ambiental',
    meta: '#0B0A1A',
    swatch: 'radial-gradient(circle at 25% 25%, #5a6aff, transparent 55%), radial-gradient(circle at 80% 30%, #d04adc, transparent 55%), radial-gradient(circle at 50% 90%, #28c8e6, transparent 55%), #13103a',
  },
];

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.meta);
}
