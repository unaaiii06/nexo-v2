import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isCloud, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const LOCAL_USER = { id: 'local', email: null, name: 'Yo' };
const LOCAL_NAME_KEY = 'nexo2:local-name';

function toUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.user_metadata?.name || u.email?.split('@')[0] || 'Yo' };
}

function readLocalName() {
  try {
    return localStorage.getItem(LOCAL_NAME_KEY) || LOCAL_USER.name;
  } catch {
    return LOCAL_USER.name;
  }
}

/**
 * Sesión de la persona. Con Supabase configurado: cuenta con email y contraseña.
 * Sin configurar: un único usuario local (útil para desarrollo).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(isCloud ? null : { ...LOCAL_USER, name: readLocalName() });
  const [loading, setLoading] = useState(isCloud);

  useEffect(() => {
    if (!isCloud) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session?.user));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Mantiene el perfil del servidor (nombre y zona horaria) al día
  useEffect(() => {
    if (!isCloud || !user) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
    supabase.from('profiles').upsert({ user_id: user.id, name: user.name, tz, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) console.warn('[Nexo] Perfil:', error.message);
    });
  }, [user]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(translate(error.message));
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() }, emailRedirectTo: window.location.href.split('#')[0] },
    });
    if (error) throw new Error(translate(error.message));
    return { needsConfirmation: !data.session };
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.href.split('#')[0] });
    if (error) throw new Error(translate(error.message));
  }, []);

  const signOut = useCallback(async () => {
    if (isCloud) await supabase.auth.signOut();
  }, []);

  const rename = useCallback(async (name) => {
    const clean = name.trim().slice(0, 30);
    if (!clean) return;
    if (!isCloud) {
      try {
        localStorage.setItem(LOCAL_NAME_KEY, clean);
      } catch {
        /* sin acceso */
      }
      setUser((u) => ({ ...u, name: clean }));
      return;
    }
    const { data, error } = await supabase.auth.updateUser({ data: { name: clean } });
    if (error) throw new Error(translate(error.message));
    setUser(toUser(data.user));
  }, []);

  const value = useMemo(
    () => ({ isCloud, user, loading, signIn, signUp, signOut, resetPassword, rename }),
    [user, loading, signIn, signUp, signOut, resetPassword, rename],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

function translate(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos';
  if (m.includes('email not confirmed')) return 'Confirma tu email antes de entrar (revisa tu correo)';
  if (m.includes('already registered')) return 'Ya existe una cuenta con ese email';
  if (m.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento';
  if (m.includes('fetch')) return 'Sin conexión. Inténtalo cuando tengas internet';
  return msg || 'Algo ha fallado';
}
