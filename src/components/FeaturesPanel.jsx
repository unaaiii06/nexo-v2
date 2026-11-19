import { useStore } from '../store/AppStore';
import { FEATURE_GROUPS, DEFAULT_FEATURES, resolveFeatures } from '../lib/features';
import { cx } from '../lib/utils';

/** Interruptor estilo iOS */
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300', checked ? 'bg-ok' : 'bg-fg/15')}
    >
      <span
        className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-300 ease-spring"
        style={{ transform: checked ? 'translateX(20px)' : 'none' }}
      />
    </button>
  );
}

/** Ajustes → Funciones: activar o desactivar partes de la app */
export default function FeaturesPanel() {
  const { state, actions } = useStore();
  const f = resolveFeatures(state.settings);
  const set = (key, value) => actions.setSettings({ features: { ...f, [key]: value } });
  const off = Object.values(f).filter((v) => !v).length;

  return (
    <div className="space-y-5">
      <p className="text-[13px] muted">
        Oculta lo que no uses. No se borra nada: si vuelves a activarlo, tus datos siguen ahí. Se aplica en todos tus dispositivos.
      </p>
      {FEATURE_GROUPS.map((g) => (
        <section key={g.title}>
          <p className="eyebrow mb-2">{g.title}</p>
          <div className="divide-hairline overflow-hidden rounded-2xl card">
            {g.items.map((item) => (
              <div key={item.key} className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">{item.label}</p>
                  <p className="text-[12px] muted">{item.text}</p>
                </div>
                <Toggle checked={f[item.key]} onChange={(v) => set(item.key, v)} label={item.label} />
              </div>
            ))}
          </div>
          {g.hint && <p className="mt-1.5 px-1 text-[12px] faint">{g.hint}</p>}
        </section>
      ))}
      {off > 0 && (
        <button type="button" onClick={() => actions.setSettings({ features: { ...DEFAULT_FEATURES } })} className="btn btn-ghost w-full">
          Activar todo de nuevo ({off} {off === 1 ? 'desactivada' : 'desactivadas'})
        </button>
      )}
    </div>
  );
}
