import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './store/auth';
import { StoreProvider } from './store/AppStore';
import { UIProvider } from './store/ui';
import App from './App';
import AuthScreen from './components/AuthScreen';
import './index.css';

/** Sin sesión → pantalla de acceso. Con sesión → los datos de ESA cuenta (sincronizados). */
function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="ambient" aria-hidden="true" />;
  if (!user) return <AuthScreen />;
  return (
    <StoreProvider key={user.id} userId={user.id}>
      <UIProvider>
        <App />
      </UIProvider>
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </StrictMode>,
);
