import { useTranslation } from 'react-i18next';

interface RetrievalBannerProps {
  variant: 'searching' | 'empty' | 'privacy';
}

export function RetrievalBanner({ variant }: RetrievalBannerProps) {
  const { t } = useTranslation('chat');

  const className =
    variant === 'privacy'
      ? 'chat-retrieval chat-retrieval--privacy'
      : `chat-retrieval chat-retrieval--${variant}`;

  return (
    <p className={className} role="status">
      {t(`retrieval.${variant}`)}
    </p>
  );
}
