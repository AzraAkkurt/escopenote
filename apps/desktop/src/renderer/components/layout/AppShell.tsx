import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { useFixturesMode } from '@renderer/config/env';
import { KeyboardShortcutsModal } from '@renderer/components/layout/KeyboardShortcutsModal';
import { OfflineBanner } from '@renderer/components/layout/OfflineBanner';
import { OnboardingWizard } from '@renderer/components/onboarding/OnboardingWizard';
import { NavItem } from './NavItem';
import { TitleBar } from './TitleBar';
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts';
import { useAppSettings } from '@renderer/providers/SettingsProvider';

const NAV_ROUTES = [
  { to: '/', key: 'overview', end: true },
  { to: '/library', key: 'library' },
  { to: '/notes', key: 'notes' },
  { to: '/chat', key: 'chat' },
  { to: '/settings', key: 'settings' },
] as const;

export function AppShell() {
  const { t } = useTranslation('navigation');
  const { settings } = useAppSettings();
  const fixtures = useFixturesMode();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const onNewChat = useCallback(() => {
    window.dispatchEvent(new CustomEvent('escopenote:new-chat'));
  }, []);

  useKeyboardShortcuts({
    onNewChat,
    onShowHelp: () => setShortcutsOpen(true),
    enabled: true,
  });

  const showOnboarding = !fixtures && !settings.onboardingCompleted;

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-shell__body">
        <aside className="app-shell__sidebar" aria-label={t('mainAria')}>
          <nav className="app-shell__nav">
            {NAV_ROUTES.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={t(item.key)}
                end={'end' in item ? item.end : undefined}
              />
            ))}
          </nav>
        </aside>
        <main className="app-shell__content" id="main-content" tabIndex={-1}>
          <OfflineBanner />
          <Outlet />
        </main>
      </div>
      <OnboardingWizard open={showOnboarding} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
