import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppPlatform } from '@shared/platform';

export function TitleBar() {
  const { t } = useTranslation('common');
  const [platform, setPlatform] = useState<AppPlatform | 'other' | null>(null);
  const [maximized, setMaximized] = useState(false);
  const showControls = platform === 'linux' || platform === 'win32';

  useEffect(() => {
    if (!window.escopenote) {
      return;
    }

    void window.escopenote.getPlatform().then(setPlatform);
    void window.escopenote.window.isMaximized().then(setMaximized);
  }, []);

  const handleMaximize = () => {
    window.escopenote?.window.maximizeToggle();
    setMaximized((prev) => !prev);
  };

  const platformLabel =
    platform && platform !== 'other' ? t(`platform.${platform}`) : null;

  return (
    <header className={`title-bar${showControls ? ' title-bar--custom' : ''}`}>
      <div className="title-bar__drag">
        <span className="title-bar__brand">{t('appName')}</span>
        {platformLabel ? <span className="title-bar__platform">{platformLabel}</span> : null}
      </div>
      {showControls ? (
        <div className="title-bar__controls">
          <button
            type="button"
            className="title-bar__btn"
            aria-label={t('window.minimize')}
            onClick={() => window.escopenote?.window.minimize()}
          />
          <button
            type="button"
            className={`title-bar__btn title-bar__btn--maximize${maximized ? ' is-maximized' : ''}`}
            aria-label={maximized ? t('window.restore') : t('window.maximize')}
            onClick={handleMaximize}
          />
          <button
            type="button"
            className="title-bar__btn title-bar__btn--close"
            aria-label={t('window.close')}
            onClick={() => window.escopenote?.window.close()}
          />
        </div>
      ) : null}
    </header>
  );
}
