import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Editor, Range } from '@tiptap/core';
import { Button, Input, Modal } from '@renderer/components/ui';

export const DEFAULT_TABLE_ROWS = 3;
export const DEFAULT_TABLE_COLS = 3;
export const MIN_TABLE_SIZE = 1;
export const MAX_TABLE_SIZE = 20;

export interface TableInsertRequest {
  editor: Editor;
  range?: Range;
}

interface TableInsertModalProps {
  request: TableInsertRequest | null;
  onClose: () => void;
}

export function TableInsertModal({ request, onClose }: TableInsertModalProps) {
  const { t } = useTranslation('notes');
  const [rows, setRows] = useState(String(DEFAULT_TABLE_ROWS));
  const [cols, setCols] = useState(String(DEFAULT_TABLE_COLS));
  const [withHeaderRow, setWithHeaderRow] = useState(true);

  useEffect(() => {
    if (!request) {
      return;
    }
    setRows(String(DEFAULT_TABLE_ROWS));
    setCols(String(DEFAULT_TABLE_COLS));
    setWithHeaderRow(true);
  }, [request]);

  const clampSize = useCallback((value: string) => {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) {
      return MIN_TABLE_SIZE;
    }
    return Math.min(MAX_TABLE_SIZE, Math.max(MIN_TABLE_SIZE, n));
  }, []);

  const handleInsert = useCallback(() => {
    if (!request) {
      return;
    }
    const rowCount = clampSize(rows);
    const colCount = clampSize(cols);
    const { editor, range } = request;

    const chain = editor.chain().focus();
    if (range) {
      chain.deleteRange(range);
    }
    chain.insertTable({ rows: rowCount, cols: colCount, withHeaderRow }).run();
    onClose();
  }, [clampSize, cols, onClose, request, rows, withHeaderRow]);

  const previewRows = clampSize(rows);
  const previewCols = clampSize(cols);

  return (
    <Modal isOpen={request !== null} title={t('tableModal.title')} onClose={onClose}>
      <div className="table-insert-modal">
        <p className="table-insert-modal__hint">{t('tableModal.hint')}</p>

        <div className="table-insert-modal__fields">
          <label className="table-insert-modal__field">
            <span>{t('tableModal.rows')}</span>
            <Input
              type="number"
              min={MIN_TABLE_SIZE}
              max={MAX_TABLE_SIZE}
              value={rows}
              onChange={(e) => setRows(e.target.value)}
            />
          </label>
          <span className="table-insert-modal__times" aria-hidden>
            ×
          </span>
          <label className="table-insert-modal__field">
            <span>{t('tableModal.cols')}</span>
            <Input
              type="number"
              min={MIN_TABLE_SIZE}
              max={MAX_TABLE_SIZE}
              value={cols}
              onChange={(e) => setCols(e.target.value)}
            />
          </label>
        </div>

        <label className="table-insert-modal__checkbox">
          <input
            type="checkbox"
            checked={withHeaderRow}
            onChange={(e) => setWithHeaderRow(e.target.checked)}
          />
          <span>{t('tableModal.headerRow')}</span>
        </label>

        <div
          className="table-insert-modal__preview"
          aria-label={t('tableModal.previewAria')}
          style={{
            gridTemplateColumns: `repeat(${previewCols}, 1fr)`,
          }}
        >
          {Array.from({ length: previewRows * previewCols }).map((_, i) => {
            const isHeader = withHeaderRow && i < previewCols;
            return (
              <span
                key={i}
                className={`table-insert-modal__cell${isHeader ? ' table-insert-modal__cell--header' : ''}`}
              />
            );
          })}
        </div>

        <footer className="table-insert-modal__actions">
          <Button variant="ghost" onClick={onClose}>
            {t('tableModal.cancel')}
          </Button>
          <Button variant="primary" onClick={handleInsert}>
            {t('tableModal.insert')}
          </Button>
        </footer>
      </div>
    </Modal>
  );
}
