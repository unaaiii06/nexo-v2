import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import Avatar, { PROFILE_COLORS, colorFor, fileToAvatar, useProfileLook } from './Avatar';
import { cx } from '../lib/utils';

function useSetProfile() {
  const { actions } = useStore();
  const look = useProfileLook();
  return (patch) => actions.setSettings({ profile: { ...look, ...patch } });
}

/** Foto de perfil con botón de cámara (en el iPhone ofrece cámara o fototeca) */
function Photo({ name }) {
  const look = useProfileLook();
  const setProfile = useSetProfile();
  const { showToast } = useUI();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      setProfile({ photo: await fileToAvatar(file) });
      showToast('Foto de perfil actualizada');
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => input.current?.click()} className="pressable relative block rounded-full" aria-label="Cambiar foto de perfil">
        <Avatar name={name} size={64} color={look.color} photo={look.photo} />
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent"
          style={{ boxShadow: '0 0 0 2.5px var(--panel-strong)' }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}

function Swatches({ value, fallback, onChange, label }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cx('chip !min-h-[28px] !px-2.5 !text-[12px]', !value && 'chip-active')}
        aria-checked={!value}
        role="radio"
      >
        Auto
      </button>
      {PROFILE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={`Color ${c}`}
          onClick={() => onChange(c)}
          className="tap-target h-7 w-7 rounded-full transition-transform duration-300 ease-spring"
          style={{
            background: c,
            transform: value === c ? 'scale(1.15)' : undefined,
            boxShadow: value === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        />
      ))}
      <label
        className="tap-target relative h-7 w-7 cursor-pointer overflow-hidden rounded-full"
        title="Cualquier color"
        style={{ background: value && !PROFILE_COLORS.includes(value) ? value : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
      >
        <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={value || fallback} onChange={(e) => onChange(e.target.value)} aria-label="Elegir cualquier color" />
      </label>
    </div>
  );
}

/** Color del avatar, color del nombre y quitar foto */
function Colors({ name }) {
  const look = useProfileLook();
  const setProfile = useSetProfile();
  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="mb-2 text-[13px] font-medium muted">{look.photo ? 'Color del borde de la foto' : 'Color del avatar'}</p>
        <Swatches value={look.color} fallback={colorFor(name)} onChange={(color) => setProfile({ color })} label="Color del avatar" />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium muted">
          Color de tu nombre ·{' '}
          <span className="font-semibold" style={{ color: look.nameColor || 'rgb(var(--fg))' }}>
            {name}
          </span>
        </p>
        <Swatches value={look.nameColor} fallback="#0a84ff" onChange={(nameColor) => setProfile({ nameColor })} label="Color del nombre" />
      </div>
      {look.photo && (
        <button type="button" onClick={() => setProfile({ photo: null })} className="btn btn-ghost w-full text-danger">
          <Trash2 size={16} /> Quitar foto
        </button>
      )}
    </div>
  );
}

const ProfileEditor = { Photo, Colors };
export default ProfileEditor;
