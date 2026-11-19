import { Check, RotateCcw } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { THEMES, THEME_GROUPS, ACCENTS, FONTS, CORNERS, GLASS, AMBIENT, MOTION, DEFAULT_CUSTOM, swatch } from '../lib/themes';
import { Segmented } from './primitives';
import { cx } from '../lib/utils';

/** Tarjetas de tema con mini‑previsualización */
export function ThemeCards() {
  const { state, actions } = useStore();
  return (
    <div className="space-y-4">
      {THEME_GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-2 text-[12px] font-medium muted">{group}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEMES.filter((t) => t.group === group).map((t) => {
              const active = state.settings.theme === t.id;
              const light = t.scheme === 'light';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => actions.setSettings({ theme: t.id })}
                  className={cx('pressable relative overflow-hidden rounded-2xl p-1.5 text-left card', active && 'ring-2 ring-accent')}
                  aria-pressed={active}
                >
                  <div className="relative h-20 overflow-hidden rounded-xl" style={{ background: swatch(t) }}>
                    {/* Mini interfaz: panel de cristal + botón de acento */}
                    <div
                      className="absolute bottom-2 left-2 right-2 flex h-8 items-center gap-1.5 rounded-lg px-2"
                      style={{
                        background: light ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.1)',
                        border: light ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.18)',
                      }}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ background: `rgb(${t.accent})` }} />
                      <span className="h-1.5 flex-1 rounded-full" style={{ background: `rgb(${t.fg} / 0.35)` }} />
                      <span className="h-3 w-6 rounded-full" style={{ background: `rgb(${t.accent2})` }} />
                    </div>
                    {t.animated && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/30 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                        Vivo
                      </span>
                    )}
                    {active && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="px-1.5 pb-1 pt-2">
                    <p className="truncate text-[14px] font-semibold tracking-tight">{t.name}</p>
                    <p className="truncate text-[12px] muted">{t.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Option({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium muted">{label}</p>
      {children}
    </div>
  );
}

const opts = (obj) => Object.entries(obj).map(([value, o]) => ({ value, label: o.name }));

/** Personalización encima del tema */
export function Customizer() {
  const { state, actions } = useStore();
  const theme = THEMES.find((t) => t.id === state.settings.theme) || THEMES[0];
  const c = { ...DEFAULT_CUSTOM, ...(state.settings.custom || {}) };
  const set = (patch) => actions.setSettings({ custom: { ...c, ...patch } });
  const changed = JSON.stringify(c) !== JSON.stringify(DEFAULT_CUSTOM);
  const ambientNow = c.ambient || (theme.animated ? 'animated' : 'static');

  return (
    <div className="space-y-5 rounded-2xl p-4 card">
      <Option label="Color de acento">
        <div className="flex flex-wrap items-center gap-2.5">
          {ACCENTS.map((a) => {
            const active = (c.accent || null) === a.id;
            const color = a.id || `rgb(${theme.accent})`;
            return (
              <button
                key={a.name}
                type="button"
                onClick={() => set({ accent: a.id })}
                title={a.name}
                aria-label={`Acento ${a.name}`}
                aria-pressed={active}
                className="tap-target relative h-8 w-8 rounded-full transition-transform duration-300 ease-spring"
                style={{
                  background: a.id ? color : `conic-gradient(rgb(${theme.accent}), rgb(${theme.accent2}), rgb(${theme.accent}))`,
                  transform: active ? 'scale(1.12)' : undefined,
                  boxShadow: active ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}` : 'inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              />
            );
          })}
          <label className="tap-target relative h-8 w-8 cursor-pointer overflow-hidden rounded-full" title="Color personalizado" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
            <input
              type="color"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              value={c.accent && c.accent.startsWith('#') ? c.accent : '#0a84ff'}
              onChange={(e) => set({ accent: e.target.value })}
              aria-label="Elegir cualquier color"
            />
          </label>
        </div>
      </Option>

      <Option label="Tipografía">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(FONTS).map(([id, f]) => {
            const active = (c.font || theme.font || 'system') === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => set({ font: id })}
                className={cx('pressable rounded-xl px-3 py-2.5 text-left card', active && 'ring-2 ring-accent')}
                style={{ fontFamily: f.stack }}
              >
                <span className="block text-[20px] font-semibold leading-none">Aa</span>
                <span className="mt-1 block text-[12px] muted">{f.name}</span>
              </button>
            );
          })}
        </div>
      </Option>

      <Option label="Esquinas">
        <Segmented size="sm" options={opts(CORNERS)} value={c.corners} onChange={(v) => set({ corners: v })} />
      </Option>
      <Option label="Efecto cristal">
        <Segmented size="sm" options={opts(GLASS)} value={c.glass} onChange={(v) => set({ glass: v })} />
      </Option>
      <Option label="Fondo">
        <Segmented size="sm" options={opts(AMBIENT)} value={ambientNow} onChange={(v) => set({ ambient: v })} />
      </Option>
      <Option label="Animaciones">
        <Segmented size="sm" options={opts(MOTION)} value={c.motion} onChange={(v) => set({ motion: v })} />
      </Option>

      {changed && (
        <button type="button" onClick={() => actions.setSettings({ custom: null })} className="btn btn-ghost w-full">
          <RotateCcw size={16} /> Restablecer personalización
        </button>
      )}
    </div>
  );
}
