import { useEffect, useState } from 'react';

/** Tema activo leído de <html data-theme>, reactivo a los cambios */
export function useActiveThemeId() {
  const [id, setId] = useState(() => document.documentElement.dataset.theme || 'obsidian');
  useEffect(() => {
    const obs = new MutationObserver(() => setId(document.documentElement.dataset.theme || 'obsidian'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return id;
}

/** Logo «NE» de Nexo con la versión del tema (o la de `theme` si se indica) */
export default function AppLogo({ size = 34, theme, className = '' }) {
  const active = useActiveThemeId();
  const id = theme || active;
  return (
    <img
      src={`./icons/${id}.svg`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }}
    />
  );
}
