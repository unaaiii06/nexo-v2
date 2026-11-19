import { createPortal } from 'react-dom';
import { useUI } from '../store/ui';

export default function Toast() {
  const { toast, hideToast } = useUI();
  if (!toast) return null;
  return createPortal(
    <div
      key={toast.key}
      className="glass-strong fixed left-1/2 z-[80] flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-full py-2 pl-5 pr-2 text-[14px] font-medium"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 150px)',
        animation: 'toast-in 0.45s cubic-bezier(0.22,1,0.36,1) both',
        minHeight: 44,
      }}
      role="status"
      aria-live="polite"
    >
      <span className="truncate py-1">{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action.run();
            hideToast();
          }}
          className="shrink-0 rounded-full bg-accent/15 px-3.5 py-1.5 font-semibold text-accent active:scale-95"
        >
          {toast.action.label}
        </button>
      ) : (
        <span className="w-3" />
      )}
    </div>,
    document.body,
  );
}
