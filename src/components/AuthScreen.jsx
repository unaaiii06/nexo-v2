import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../store/auth';
import { shortGreeting } from '../lib/greetings';
import { Segmented } from './primitives';
import { cx } from '../lib/utils';

/** Entrar o crear cuenta (email + contraseña). La misma cuenta en el móvil y en el Mac = datos sincronizados. */
export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const valid = email.includes('@') && password.length >= 6 && (mode === 'login' || name.trim());

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'login') await signIn(email, password);
      else {
        const { needsConfirmation } = await signUp(name, email, password);
        if (needsConfirmation) {
          setNotice('Te hemos enviado un email para confirmar la cuenta. Ábrelo, confirma y vuelve aquí para entrar.');
          setMode('login');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.includes('@')) {
      setError('Escribe tu email y vuelve a tocar «¿Has olvidado la contraseña?»');
      return;
    }
    try {
      await resetPassword(email);
      setNotice('Te hemos enviado un email para cambiar la contraseña.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto px-5 py-10">
      <div className="ambient" aria-hidden="true" />
      <form onSubmit={submit} className="glass-strong relative w-full max-w-md rounded-[calc(32px*var(--rk))] p-7 animate-pop-in">
        <div className="text-center">
          <img src="./icon.svg" alt="" width={64} height={64} className="mx-auto rounded-[calc(16px*var(--rk))] shadow-xl" />
          <p className="mt-5 text-[15px] muted">{shortGreeting()}</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{mode === 'login' ? 'Entra en Nexo' : 'Crea tu cuenta'}</h1>
          <p className="mx-auto mt-1.5 max-w-[300px] text-[14px] muted">
            Usa la misma cuenta en el iPhone y en el Mac y tus tareas se sincronizarán solas.
          </p>
        </div>

        <Segmented
          className="mt-6"
          options={[
            { value: 'login', label: 'Entrar' },
            { value: 'signup', label: 'Crear cuenta' },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setError('');
          }}
        />

        <div className="mt-4 space-y-3">
          {mode === 'signup' && (
            <input
              className="field"
              placeholder="Tu nombre (para saludarte)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              autoCapitalize="words"
              aria-label="Nombre"
            />
          )}
          <input
            className="field"
            type="email"
            inputMode="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            aria-label="Email"
          />
          <div className="relative">
            <input
              className="field pr-12"
              type={show ? 'text' : 'password'}
              placeholder="Contraseña (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-label="Contraseña"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="icon-btn absolute right-0 top-1/2 -translate-y-1/2 muted"
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}
        {notice && (
          <p className="mt-3 flex gap-2 rounded-xl bg-ok/10 px-3 py-2 text-[13px] text-ok">
            <MailCheck size={16} className="mt-0.5 shrink-0" /> {notice}
          </p>
        )}

        <button type="submit" disabled={!valid || busy} className={cx('btn btn-primary mt-5 w-full', (!valid || busy) && 'opacity-50')}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          {!busy && <ArrowRight size={17} />}
        </button>
        {mode === 'login' && (
          <button type="button" onClick={forgot} className="mt-2 min-h-[44px] w-full text-[14px] muted">
            ¿Has olvidado la contraseña?
          </button>
        )}
      </form>
    </div>
  );
}
