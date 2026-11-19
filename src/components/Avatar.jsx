import { useStore } from '../store/AppStore';

const COLORS = ['#0A84FF', '#FF375F', '#30D158', '#BF5AF2', '#FF9F0A', '#64D2FF'];

/** Colores para el avatar y el nombre */
export const PROFILE_COLORS = ['#0A84FF', '#5E5CE6', '#BF5AF2', '#FF375F', '#FF453A', '#FF9F0A', '#FFD60A', '#30D158', '#00C7BE', '#64D2FF', '#AC8E68', '#8E8E93'];

/** Color estable a partir del nombre (si no se ha elegido uno) */
export function colorFor(name = '') {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

/** Aspecto del perfil guardado en Ajustes (se sincroniza entre dispositivos) */
export function useProfileLook() {
  const { state } = useStore();
  return state.settings.profile || {};
}

/** Avatar: foto de perfil o círculo con la inicial */
export default function Avatar({ name = '?', size = 36, color, photo }) {
  const c = color || colorFor(name);
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        width={size}
        height={size}
        className="shrink-0 select-none rounded-full object-cover"
        style={{ width: size, height: size, boxShadow: `0 0 0 2px var(--bg), 0 0 0 3.5px ${c}, 0 4px 14px rgba(0,0,0,0.25)` }}
        draggable={false}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(145deg, color-mix(in srgb, ${c} 70%, white), ${c} 55%, color-mix(in srgb, ${c} 70%, black))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 14px color-mix(in srgb, ${c} 40%, transparent)`,
      }}
      aria-hidden="true"
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** Avatar de la persona con sesión iniciada (con su foto y color) */
export function MyAvatar({ name, size }) {
  const look = useProfileLook();
  return <Avatar name={name} size={size} color={look.color} photo={look.photo} />;
}

/** Recorta al centro, reduce a 256 px y comprime a JPEG (≈ 15–30 KB) */
export function fileToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Elige una imagen'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}
