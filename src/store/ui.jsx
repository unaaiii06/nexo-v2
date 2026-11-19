import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export const VIEWS = ['inbox', 'today', 'week', 'month', 'areas'];

const UIContext = createContext(null);

const VIEW_KEY = 'nexo2:view';

function initialView() {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (VIEWS.includes(v)) return v;
  } catch {
    /* almacenamiento no disponible */
  }
  return 'today';
}

export function UIProvider({ children }) {
  const [view, setViewState] = useState(initialView);
  const [areaFilter, setAreaFilter] = useState(null);
  const [editor, setEditor] = useState(null); // { type, item?, defaults? }
  const [spotlight, setSpotlight] = useState(false);
  const [settings, setSettings] = useState(false);
  const [review, setReview] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const setView = useCallback((v, opts = {}) => {
    setViewState(v);
    if ('area' in opts) setAreaFilter(opts.area);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* almacenamiento no disponible */
    }
    window.scrollTo(0, 0);
  }, []);

  const showToast = useCallback((message, action) => {
    clearTimeout(toastTimer.current);
    setToast({ message, action, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), action ? 4500 : 2400);
  }, []);

  const hideToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({
      view,
      setView,
      areaFilter,
      setAreaFilter,
      editor,
      openEditor: (type, item = null, defaults = {}) => setEditor({ type, item, defaults, key: Date.now() }),
      closeEditor: () => setEditor(null),
      spotlight,
      setSpotlight,
      settings,
      setSettings,
      review,
      setReview,
      toast,
      showToast,
      hideToast,
    }),
    [view, setView, areaFilter, editor, spotlight, settings, review, toast, showToast, hideToast],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>');
  return ctx;
}
