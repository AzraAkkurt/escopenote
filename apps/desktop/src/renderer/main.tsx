import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { App } from './App';
import i18n from './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IpcErrorListener } from './components/IpcErrorListener';
import { GatewayProvider } from './providers/GatewayProvider';
import { SettingsProvider } from './providers/SettingsProvider';
import { LocaleProvider } from './theme/LocaleProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './components/ui';
import './styles/tokens.css';
import './styles/global.css';
import './components/ui/ui.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <ToastProvider>
          <SettingsProvider>
            <GatewayProvider>
              <ThemeProvider>
                <LocaleProvider>
                  <IpcErrorListener>
                    <App />
                  </IpcErrorListener>
                </LocaleProvider>
              </ThemeProvider>
            </GatewayProvider>
          </SettingsProvider>
        </ToastProvider>
      </ErrorBoundary>
    </I18nextProvider>
  </StrictMode>,
);
