import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isIpcError } from '@renderer/lib/ipc';
import { useToast } from '@renderer/components/ui';

/**
 * Surfaces unhandled IPC rejections as toasts (e.g. validation errors in dev).
 */
export function IpcErrorListener({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { t } = useTranslation('common');

  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isIpcError(event.reason)) {
        toast.show(`${t('errors.ipc')}: ${event.reason.message}`, 'error');
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, [toast, t]);

  return children;
}
