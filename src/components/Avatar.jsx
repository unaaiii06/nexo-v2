const COLORS = ['#0A84FF', '#FF375F', '#30D158', '#BF5AF2', '#FF9F0A', '#64D2FF'];

/** Color estable a partir del nombre */
export function colorFor(name = '') {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

/** Círculo con la inicial de la persona */
export default function Avatar({ name = '?', size = 36 }) {
  const c = colorFor(name);
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
