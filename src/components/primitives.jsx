import { useEffect, useRef, useState } from 'react';
import { cx, PRIORITIES } from '../lib/utils';
import { AREA_ICONS, iconFor } from './icons';

/** Anillo de progreso estilo Apple Fitness */
export function ProgressRing({ value = 0, size = 112, stroke = 12, color = 'rgb(var(--accent))', track, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const gid = useRef(`ring_${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent-2))" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track || 'rgb(var(--fg) / 0.08)'} strokeWidth={stroke} />
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ filter: v > 0 ? 'drop-shadow(0 0 6px rgb(var(--accent) / 0.45))' : undefined }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Barra de progreso fluida (anima transform, no width) */
export function ProgressBar({ value = 0, color, height = 6, className, level }) {
  const v = Math.max(0, Math.min(100, value));
  const bg =
    color ||
    (level === 'over' ? 'rgb(var(--danger))' : level === 'high' ? 'rgb(var(--warn))' : 'linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))');
  return (
    <div
      className={cx('w-full overflow-hidden rounded-full', className)}
      style={{ height, background: 'rgb(var(--fg) / 0.08)' }}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-fill h-full w-full rounded-full" style={{ transform: `scaleX(${v / 100})`, background: bg }} />
    </div>
  );
}

/** Check animado: el trazo se dibuja y rebota al completar */
export function Check({ checked, onChange, color = 'rgb(var(--accent))', size = 24, label }) {
  const [anim, setAnim] = useState(false);
  const prev = useRef(checked);
  useEffect(() => {
    if (checked && !prev.current) {
      setAnim(true);
      const t = setTimeout(() => setAnim(false), 600);
      prev.current = checked;
      return () => clearTimeout(t);
    }
    prev.current = checked;
  }, [checked]);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label || (checked ? 'Marcar como pendiente' : 'Marcar como completada')}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!checked);
      }}
      className="tap-target relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {anim && <span className="check-ripple absolute inset-0 rounded-full" style={{ background: color }} />}
      <span
        className={cx('relative flex h-full w-full items-center justify-center rounded-full transition-colors duration-300', anim && 'animate-check')}
        style={{
          background: checked ? color : 'transparent',
          border: checked ? `1.5px solid ${color}` : '1.5px solid rgb(var(--fg) / 0.28)',
          boxShadow: checked ? `0 0 12px -2px ${color}` : 'none',
        }}
      >
        {checked && (
          <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
            <path
              className="check-path"
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

export function PriorityDot({ priority, className }) {
  if (!priority) return null;
  return (
    <span
      className={cx('glow-dot', className)}
      style={{ color: PRIORITIES[priority].color, width: 7, height: 7 }}
      title={`Prioridad ${PRIORITIES[priority].label.toLowerCase()}`}
    />
  );
}

export function AreaBadge({ area, compact }) {
  if (!area) return null;
  const Icon = iconFor(AREA_ICONS, area.icon);
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[12px] font-medium" style={{ color: area.color }}>
      <Icon size={12} strokeWidth={2.4} className="shrink-0" />
      {!compact && <span className="truncate">{area.name}</span>}
    </span>
  );
}

export function AreaIcon({ area, size = 18, box = 36 }) {
  const Icon = iconFor(AREA_ICONS, area?.icon);
  const color = area?.color || '#888';
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: box,
        height: box,
        color,
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      <Icon size={size} strokeWidth={2.2} />
    </span>
  );
}

export function SectionTitle({ icon: Icon, title, subtitle, right, className }) {
  return (
    <div className={cx('mb-3 flex items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Icon size={15} strokeWidth={2.4} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="truncate text-[13px] muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center animate-fade-in">
      {Icon && (
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl card text-accent">
          <Icon size={22} />
        </span>
      )}
      <p className="font-semibold tracking-tight">{title}</p>
      {text && <p className="mt-1 max-w-xs text-[14px] muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Control segmentado estilo iOS */
export function Segmented({ options, value, onChange, size = 'md', className }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      className={cx('relative grid rounded-xl p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, background: 'var(--field)', border: '1px solid var(--hairline)' }}
      role="tablist"
    >
      <span
        className="absolute bottom-1 top-1 rounded-[calc(9px*var(--rk))] transition-transform duration-500 ease-spring"
        style={{
          left: 4,
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${idx * 100}%)`,
          background: 'var(--panel-strong)',
          boxShadow: 'var(--specular), 0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid var(--hairline)',
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'relative z-10 flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
            size === 'sm' ? 'min-h-[32px] text-[13px]' : 'min-h-[38px] text-[14px]',
            o.value === value ? 'text-fg' : 'text-fg/55',
          )}
        >
          {o.icon && <o.icon size={15} className="hidden shrink-0 sm:block" />}
          <span className="truncate">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
