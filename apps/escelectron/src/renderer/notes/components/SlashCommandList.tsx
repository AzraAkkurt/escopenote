import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import type { SuggestionProps } from '@tiptap/suggestion';
import {
  SLASH_GROUP_ORDER,
  type SlashCommandGroup,
  type SlashCommandItem,
} from '@renderer/notes/extensions/slash-commands';

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandListProps extends SuggestionProps<SlashCommandItem> {
  groupLabels: Record<SlashCommandGroup, string>;
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  function SlashCommandList({ items, command, groupLabels }, ref) {
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

    const grouped = useMemo(() => {
      const map = new Map<SlashCommandGroup, SlashCommandItem[]>();
      for (const group of SLASH_GROUP_ORDER) {
        map.set(group, []);
      }
      for (const item of items) {
        map.get(item.group)?.push(item);
      }
      return SLASH_GROUP_ORDER.map((group) => ({
        group,
        label: groupLabels[group],
        items: map.get(group) ?? [],
      })).filter((entry) => entry.items.length > 0);
    }, [groupLabels, items]);

    if (items.length === 0) {
      return (
        <div className="slash-menu">
          <p className="slash-menu__empty">—</p>
        </div>
      );
    }

    let flatIndex = 0;

    return (
      <div className="slash-menu" role="listbox">
        {grouped.map(({ group, label, items: groupItems }) => (
          <div key={group} className="slash-menu__group">
            <p className="slash-menu__group-label">{label}</p>
            <ul className="slash-menu__list">
              {groupItems.map((item) => {
                const index = flatIndex++;
                const active = index === selectedIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`slash-menu__item${active ? ' slash-menu__item--active' : ''}`}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectItem(index);
                      }}
                    >
                      <span className="slash-menu__icon" aria-hidden>
                        {item.icon}
                      </span>
                      <span className="slash-menu__text">
                        <span className="slash-menu__title">{item.title}</span>
                        <span className="slash-menu__desc">{item.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  },
);
