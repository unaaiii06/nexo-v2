import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '../lib/utils';
import { useMediaQuery } from '../lib/hooks';

let openSheets = 0;

/**
 * Bottom Sheet en iPhone (sube desde abajo, se cierra arrastrando el asa)
 * y modal centrado en escritorio.
 */
export default function Sheet({ open, onClose, title, subtitle, children, footer, size = 'md', headerRight }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [kb, setKb] = useState(0);
  const drag = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Bloqueo del scroll del fondo y tecla Escape
  useEffect(() => {
    if (!open) return;
    openSheets++;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      openSheets--;
      if (openSheets <= 0) document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Mantiene la hoja sobre el teclado de iOS (visualViewport)
  useEffect(() => {
    if (!open || isDesktop || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setKb(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [open, isDesktop]);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setDragY(0);
    }
  }, [open]);

  function requestClose() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setDragY(0);
      closeRef.current?.();
    }, 260);
  }

  if (!open) return null;

  const onPointerDown = (e) => {
    if (isDesktop) return;
    drag.current = { y: e.clientY, t: performance.now() };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    setDragY(Math.max(0, e.clientY - drag.current.y));
  };
  const onPointerUp = (e) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.y;
    const v = dy / Math.max(1, performance.now() - drag.current.t);
    drag.current = null;
    setDragging(false);
    if (dy > 110 || v > 0.6) requestClose();
    else setDragY(0);
  };

  const maxW = size === 'lg' ? 'md:max-w-2xl' : size === 'sm' ? 'md:max-w-md' : 'md:max-w-xl';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={cx('absolute inset-0 transition-opacity duration-300', closing ? 'opacity-0' : 'animate-fade-in')}
        style={{ background: 'var(--scrim)' }}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        className={cx(
          'glass-strong relative flex w-full flex-col overflow-hidden',
          'rounded-t-[28px] md:rounded-[28px]',
          maxW,
          !closing && (isDesktop ? 'animate-pop-in' : 'animate-sheet-up'),
        )}
        style={{
          maxHeight: isDesktop ? 'min(86vh, 860px)' : `calc(100dvh - ${kb}px - env(safe-area-inset-top) - 12px)`,
          marginBottom: isDesktop ? 0 : kb,
          transform: closing
            ? isDesktop
              ? 'scale(0.97)'
              : 'translate3d(0,100%,0)'
            : dragY
              ? `translate3d(0, ${dragY}px, 0)`
              : undefined,
          opacity: closing && isDesktop ? 0 : 1,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.25s',
        }}
      >
        {/* Asa + cabecera (zona de arrastre en iPhone) */}
        <div
          className="shrink-0 touch-none select-none px-5 pt-2 md:pt-5"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto mb-2 h-[5px] w-10 rounded-full md:hidden" style={{ background: 'rgb(var(--fg) / 0.22)' }} />
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="min-w-0 pt-1">
              <h2 className="text-[20px] font-semibold leading-tight tracking-tight">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[14px] muted">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-1">
              {headerRight}
              <button type="button" onClick={requestClose} className="icon-btn -mr-2 -mt-1" aria-label="Cerrar">
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--field)' }}>
                  <X size={16} strokeWidth={2.5} />
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div
            className="shrink-0 border-t px-5 pt-3 hairline"
            style={{ paddingBottom: isDesktop ? 20 : kb ? 14 : 'max(14px, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
        {!footer && !isDesktop && <div className="pb-safe" />}
      </div>
    </div>,
    document.body,
  );
}
