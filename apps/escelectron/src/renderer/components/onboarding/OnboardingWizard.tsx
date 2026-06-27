import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Modal } from '@renderer/components/ui';
import { useAppSettings } from '@renderer/providers/SettingsProvider';

type Step = 'privacy' | 'profile' | 'library' | 'done';

interface OnboardingWizardProps {
  open: boolean;
}

export function OnboardingWizard({ open }: OnboardingWizardProps) {
  const { t } = useTranslation('onboarding');
  const { updateSettings } = useAppSettings();
  const [step, setStep] = useState<Step>('privacy');

  const finish = async () => {
    await updateSettings({
      onboardingCompleted: true,
      privacyAcknowledged: true,
      preferencesInitialized: true,
    });
  };

  const skipAll = () => {
    void finish();
  };

  if (!open) {
    return null;
  }

  return (
    <Modal isOpen title={t('title')} onClose={() => void skipAll()} closeLabel={t('skip')}>
      <div className="onboarding">
        {step === 'privacy' ? (
          <>
            <p className="onboarding__lead">{t('privacy.lead')}</p>
            <ul className="onboarding__list">
              <li>{t('privacy.local')}</li>
              <li>{t('privacy.chunks')}</li>
              <li>{t('privacy.keys')}</li>
            </ul>
            <div className="onboarding__actions">
              <Button variant="ghost" onClick={() => void skipAll()}>
                {t('skip')}
              </Button>
              <Button variant="primary" onClick={() => setStep('profile')}>
                {t('next')}
              </Button>
            </div>
          </>
        ) : null}

        {step === 'profile' ? (
          <>
            <p>{t('profile.body')}</p>
            <div className="onboarding__actions">
              <Button variant="ghost" onClick={() => setStep('library')}>
                {t('skipStep')}
              </Button>
              <Link to="/library" onClick={() => setStep('library')}>
                <Button variant="primary">{t('profile.cta')}</Button>
              </Link>
            </div>
          </>
        ) : null}

        {step === 'library' ? (
          <>
            <p>{t('library.body')}</p>
            <div className="onboarding__actions">
              <Button variant="ghost" onClick={() => setStep('done')}>
                {t('skipStep')}
              </Button>
              <Link to="/library" onClick={() => setStep('done')}>
                <Button variant="primary">{t('library.cta')}</Button>
              </Link>
            </div>
          </>
        ) : null}

        {step === 'done' ? (
          <>
            <p>{t('done.body')}</p>
            <div className="onboarding__actions">
              <Link to="/notes?new=1" onClick={() => void finish()}>
                <Button variant="primary">{t('done.cta')}</Button>
              </Link>
              <Link to="/notes" onClick={() => void finish()}>
                <Button variant="secondary">{t('done.notesCta')}</Button>
              </Link>
              <Button variant="ghost" onClick={() => void finish()}>
                {t('done.later')}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
