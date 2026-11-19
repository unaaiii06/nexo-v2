import { Check } from 'lucide-react';
import { THEMES } from '../lib/themes';
import { useStore } from '../store/AppStore';
import { cx } from '../lib/utils';

/** Selector compacto (4 orbes) para el header de escritorio */
export function ThemeOrbs() {
  const { state, actions } = useStore();
  return (
    <div className="flex items-center gap-1 rounded-full p-1 card" role="radiogroup" aria-label="Tema">
      {THEMES.map((t) => {
        const active = state.settings.theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${t.name} · ${t.hint}`}
            aria-label={t.name}
            onClick={() => actions.setSettings({ theme: t.id })}
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-spring active:scale-90"
          >
            <span
              className={cx('block h-[22px] w-[22px] rounded-full transition-all duration-300', active ? 'scale-110' : 'scale-90 opacity-80')}
              style={{
                background: t.swatch,
                boxShadow: active
                  ? '0 0 0 2px var(--bg), 0 0 0 3.5px rgb(var(--accent))'
                  : 'inset 0 0 0 1px rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Selector grande con previsualización para la hoja de Ajustes */
export function ThemeCards() {
  const { state, actions } = useStore();
  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map((t) => {
        const active = state.settings.theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => actions.setSettings({ theme: t.id })}
            className={cx('pressable relative overflow-hidden rounded-2xl p-1.5 text-left card', active && 'ring-2 ring-accent')}
            aria-pressed={active}
          >
            <div className="relative h-20 overflow-hidden rounded-xl" style={{ background: t.swatch }}>
              <div
                className="absolute bottom-2 left-2 right-8 h-6 rounded-lg"
                style={{
                  background: t.id === 'alabaster' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.12)',
                  border: t.id === 'alabaster' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.2)',
                }}
              />
              {active && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="px-1.5 pb-1 pt-2">
              <p className="text-[14px] font-semibold tracking-tight">{t.name}</p>
              <p className="text-[12px] muted">{t.hint}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
