import { useEffect } from 'react';
import { useStore } from './store/AppStore';
import { useUI } from './store/ui';
import { applyTheme } from './lib/themes';
import { cx } from './lib/utils';
import { Sidebar, TabBar } from './components/Navigation';
import Header from './components/Header';
import Editor from './components/Editor';
import Spotlight from './components/Spotlight';
import SettingsSheet from './components/SettingsSheet';
import Toast from './components/Toast';
import InboxView from './views/InboxView';
import TodayView from './views/TodayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import AreasView from './views/AreasView';

const VIEWS = {
  inbox: InboxView,
  today: TodayView,
  week: WeekView,
  month: MonthView,
  areas: AreasView,
};

export default function App() {
  const { state } = useStore();
  const { view } = useUI();
  const collapsed = state.settings.sidebarCollapsed;

  // Motor de temas: data-theme + meta theme-color
  useEffect(() => {
    applyTheme(state.settings.theme);
    try {
      localStorage.setItem('nexo2:theme', state.settings.theme);
    } catch {
      /* sin acceso */
    }
  }, [state.settings.theme]);

  const View = VIEWS[view] || TodayView;

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <Sidebar />
      <div
        className={cx(
          'relative z-10 min-h-[100dvh] transition-[padding] duration-500 ease-spring',
          collapsed ? 'md:pl-[108px]' : 'md:pl-[296px]',
        )}
      >
        <main
          className="px-safe mx-auto w-full max-w-[1400px] pb-[calc(env(safe-area-inset-bottom)+110px)] md:pb-10 md:pr-6"
        >
          <Header />
          <div key={view} className="animate-fade-up">
            <View />
          </div>
        </main>
      </div>
      <TabBar />
      <Editor />
      <Spotlight />
      <SettingsSheet />
      <Toast />
    </>
  );
}
