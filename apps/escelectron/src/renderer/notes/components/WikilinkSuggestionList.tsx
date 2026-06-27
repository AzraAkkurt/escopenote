import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { SuggestionProps } from '@tiptap/suggestion';
import {
  LINK_PICKER_BROWSE_ID,
  type WikilinkSuggestionItem,
} from '@renderer/notes/components/link-picker-types';

export interface WikilinkSuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const WikilinkSuggestionList = forwardRef<
  WikilinkSuggestionListRef,
  SuggestionProps<WikilinkSuggestionItem>
>(function WikilinkSuggestionList({ items, command }, ref) {
  const { t } = useTranslation('notes');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [command, items],
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="wikilink-suggestion">
        <p className="wikilink-suggestion__empty">{t('linkPicker.empty')}</p>
      </div>
    );
  }

  return (
    <div className="wikilink-suggestion" role="listbox">
      <ul className="wikilink-suggestion__list">
        {items.map((item, index) => {
          const active = index === selectedIndex;
          const isBrowse = item.isBrowseAll || item.id === LINK_PICKER_BROWSE_ID;
          return (
            <li key={`${item.kind}:${item.id}:${index}`}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                className={`wikilink-suggestion__item${active ? ' wikilink-suggestion__item--active' : ''}${isBrowse ? ' wikilink-suggestion__item--browse' : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectItem(index);
                }}
              >
                {isBrowse ? (
                  <span>{t('linkPicker.browseAll')}</span>
                ) : (
                  <>
                    <span className="wikilink-suggestion__badge">
                      {item.kind === 'note' ? 'N' : item.badge === 'file' ? 'F' : 'L'}
                    </span>
                    <span className="wikilink-suggestion__text">
                      <span className="wikilink-suggestion__label">{item.label}</span>
                      {item.subtitle ? (
                        <span className="wikilink-suggestion__sub">{item.subtitle}</span>
                      ) : null}
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
