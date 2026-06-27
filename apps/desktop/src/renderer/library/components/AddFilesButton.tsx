import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui';
import { LIBRARY_FILE_FILTERS } from '@renderer/library/utils';
import { ipcCall } from '@renderer/lib/ipc';

interface AddFilesButtonProps {
  onAdded: (paths: string[]) => Promise<void>;
  disabled?: boolean;
}

export function AddFilesButton({ onAdded, disabled }: AddFilesButtonProps) {
  const { t } = useTranslation('library');
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const result = await ipcCall((api) =>
        api.dialog.openFiles({
          title: t('addDialogTitle'),
          multiple: true,
          filters: LIBRARY_FILE_FILTERS,
        }),
      );
      if (!result.canceled && result.filePaths.length > 0) {
        await onAdded(result.filePaths);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="primary" onClick={() => void handleClick()} disabled={disabled || busy}>
      {busy ? t('adding') : t('addFiles')}
    </Button>
  );
}
