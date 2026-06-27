import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, Spinner } from '@renderer/components/ui';
import {
  LINK_PICKER_BROWSE_ID,
  type LinkPickerItem,
  type LinkPickerTab,
} from '@renderer/notes/components/link-picker-types';
import { useLinkPickerData } from '@renderer/notes/hooks/useLinkPickerData';

interface LinkPickerModalProps {
  open: boolean;
  courseId: string | null;
  onClose: () => void;
  onSelect: (item: LinkPickerItem) => void;
}

export function LinkPickerModal({ open, courseId, onClose, onSelect }: LinkPickerModalProps) {
  const { t } = useTranslation('notes');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<LinkPickerTab>(courseId ? 'all' : 'all');
  const { loading, scopedNoteItems, scopedResourceItems, noteItems, resourceItems } =
    useLinkPickerData(courseId);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setTab('all');
  }, [open]);

  const filterItems = useCallback(
    (items: LinkPickerItem[]) => {
      const q = query.trim().toLowerCase();
      if (!q) {
        return items;
      }
      return items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q),
      );
    },
    [query],
  );

  const visibleItems = useMemo(() => {
    let pool: LinkPickerItem[] = [];
    if (tab === 'notes') {
      pool = courseId ? scopedNoteItems : noteItems;
    } else if (tab === 'resources') {
      pool = courseId ? scopedResourceItems : resourceItems;
    } else {
      pool = [
        ...(courseId ? scopedNoteItems : noteItems),
        ...(courseId ? scopedResourceItems : resourceItems),
      ];
    }
    return filterItems(pool).slice(0, 80);
  }, [
    tab,
    courseId,
    scopedNoteItems,
    scopedResourceItems,
    noteItems,
    resourceItems,
    filterItems,
  ]);

  const handleSelect = (item: LinkPickerItem) => {
    onSelect(item);
    onClose();
  };

  return (
    <Modal isOpen={open} title={t('linkPicker.title')} onClose={onClose} size="large">
      <div className="link-picker">
        <Input
          className="link-picker__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('linkPicker.searchPlaceholder')}
          autoFocus
        />

        <div className="link-picker__tabs" role="tablist">
          {(['all', 'notes', 'resources'] as LinkPickerTab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`link-picker__tab${tab === key ? ' link-picker__tab--active' : ''}`}
              onClick={() => setTab(key)}
            >
              {t(`linkPicker.tabs.${key}`)}
            </button>
          ))}
        </div>

        {courseId ? (
          <p className="link-picker__hint">{t('linkPicker.courseHint')}</p>
        ) : null}

        <div className="link-picker__list" role="listbox">
          {loading ? (
            <div className="link-picker__loading">
              <Spinner />
            </div>
          ) : visibleItems.length === 0 ? (
            <p className="link-picker__empty">{t('linkPicker.empty')}</p>
          ) : (
            visibleItems.map((item) => (
              <button
                key={`${item.kind}:${item.id}`}
                type="button"
                role="option"
                className="link-picker__row"
                onClick={() => handleSelect(item)}
              >
                <span className={`link-picker__badge link-picker__badge--${item.badge}`}>
                  {item.kind === 'note' ? 'N' : item.badge === 'file' ? 'F' : 'L'}
                </span>
                <span className="link-picker__row-text">
                  <span className="link-picker__row-label">{item.label}</span>
                  {item.subtitle ? (
                    <span className="link-picker__row-sub">{item.subtitle}</span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>

        <footer className="link-picker__footer">
          <Button variant="ghost" onClick={onClose}>
            {t('linkPicker.cancel')}
          </Button>
        </footer>
      </div>
    </Modal>
  );
}

export { LINK_PICKER_BROWSE_ID };
