import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, CheckSquare, Target, Flag, Repeat, LayoutGrid, CornerDownLeft, Plus, ArrowRight } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { visibleNav } from './Navigation';
import { relativeDay, formatShortDate } from '../lib/dates';
import { useFeatures } from '../lib/features';
import { cx } from '../lib/utils';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Spotlight() {
  const { spotlight, setSpotlight } = useUI();
  // Atajo global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlight((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSpotlight]);

  if (!spotlight) return null;
  return <SpotlightPanel onClose={() => setSpotlight(false)} />;
}

function SpotlightPanel({ onClose }) {
  const { state, actions } = useStore();
  const f = useFeatures();
  const { setView, openEditor, showToast } = useUI();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  const results = useMemo(() => {
    const n = norm(q.trim());
    const items = [];
    const nav = visibleNav(f).filter((v) => !n || norm(v.long).includes(n)).map((v) => ({
      key: `nav_${v.id}`, group: 'Ir a', icon: v.icon, title: v.long, run: () => setView(v.id, { area: null }),
    }));
    if (!n) return nav;
    if (q.trim()) {
      items.push({
        key: 'create', group: 'Acción', icon: Plus, title: `Capturar «${q.trim()}»`, hint: 'Bandeja de entrada',
        run: () => {
          actions.addTask({ title: q.trim() });
          showToast('Añadida a la Bandeja de entrada');
        },
      });
    }
    items.push(...nav);
    state.tasks
      .filter((t) => norm(t.title).includes(n) || norm(t.notes).includes(n))
      .slice(0, 8)
      .forEach((t) =>
        items.push({
          key: t.id, group: 'Tareas', icon: CheckSquare, title: t.title, done: t.done,
          hint: t.date ? relativeDay(t.date) : t.weekOf ? 'Semana' : 'Bandeja',
          run: () => openEditor('task', t),
        }),
      );
    (f.goals ? state.goals : []).filter((g) => norm(g.title).includes(n)).forEach((g) =>
      items.push({ key: g.id, group: 'Objetivos', icon: Target, title: g.title, run: () => openEditor('goal', g) }),
    );
    (f.milestones ? state.milestones : []).filter((m) => norm(m.title).includes(n)).forEach((m) =>
      items.push({ key: m.id, group: 'Hitos', icon: Flag, title: m.title, hint: formatShortDate(m.date), run: () => openEditor('milestone', m) }),
    );
    (f.habits ? state.habits : []).filter((h) => norm(h.name).includes(n)).forEach((h) =>
      items.push({ key: h.id, group: 'Hábitos', icon: Repeat, title: h.name, run: () => openEditor('habit', h) }),
    );
    state.areas.filter((a) => norm(a.name).includes(n)).forEach((a) =>
      items.push({ key: a.id, group: 'Áreas', icon: LayoutGrid, title: a.name, run: () => setView('areas', { area: a.id }) }),
    );
    return items;
  }, [q, state, f, actions, setView, openEditor, showToast]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const run = (item) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(results.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[sel]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-center px-3 pt-[max(12px,env(safe-area-inset-top))] md:px-6 md:pt-[14vh]">
      <div className="absolute inset-0 animate-fade-in" style={{ background: 'var(--scrim)' }} onClick={onClose} />
      <div className="glass-strong relative flex max-h-[min(70vh,560px)] w-full max-w-xl flex-col overflow-hidden rounded-[calc(22px*var(--rk))] animate-pop-in" role="dialog" aria-label="Buscar">
        <div className="flex items-center gap-3 border-b px-4 hairline">
          <Search size={20} className="shrink-0 muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Busca o captura algo…"
            className="h-14 min-w-0 flex-1 bg-transparent text-[18px] outline-none placeholder:text-fg/35"
            enterKeyHint="go"
            autoComplete="off"
            aria-label="Buscar"
          />
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-medium muted md:hidden">
            Cancelar
          </button>
          <kbd className="hidden rounded-md px-1.5 py-0.5 text-[11px] muted md:inline" style={{ background: 'var(--field)' }}>
            esc
          </kbd>
        </div>
        <div ref={listRef} className="scroll-area overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-[14px] muted">Sin resultados</p>}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <div key={item.key}>
                {header && <p className="eyebrow px-3 pb-1 pt-3">{header}</p>}
                <button
                  type="button"
                  data-idx={i}
                  onMouseMove={() => setSel(i)}
                  onClick={() => run(item)}
                  className={cx(
                    'flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left transition-colors',
                    sel === i && 'bg-accent/15',
                  )}
                >
                  <Icon size={17} className={sel === i ? 'text-accent' : 'muted'} />
                  <span className={cx('min-w-0 flex-1 truncate text-[15px]', item.done && 'done-title')}>{item.title}</span>
                  {item.hint && <span className="shrink-0 text-[12px] muted">{item.hint}</span>}
                  {sel === i && (item.group === 'Ir a' ? <ArrowRight size={15} className="text-accent" /> : <CornerDownLeft size={15} className="hidden text-accent md:block" />)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
