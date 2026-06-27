import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import {
  WikilinkSuggestionList,
  type WikilinkSuggestionListRef,
} from '@renderer/notes/components/WikilinkSuggestionList';
import type { WikilinkSuggestionItem } from '@renderer/notes/components/link-picker-types';

function positionMenu(el: HTMLElement, rect: DOMRect | null) {
  if (!rect) {
    return;
  }
  el.style.position = 'fixed';
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.bottom + 6}px`;
  el.style.zIndex = '1000';
}

export function createWikilinkSuggestionRender(): NonNullable<
  SuggestionOptions<WikilinkSuggestionItem>['render']
> {
  let component: ReactRenderer<WikilinkSuggestionListRef> | null = null;
  let container: HTMLDivElement | null = null;

  return () => ({
    onStart: (props) => {
      container = document.createElement('div');
      container.className = 'wikilink-suggestion-portal';
      document.body.appendChild(container);

      component = new ReactRenderer(WikilinkSuggestionList, {
        props,
        editor: props.editor,
      });

      container.appendChild(component.element);
      positionMenu(container, props.clientRect?.() ?? null);
    },

    onUpdate: (props) => {
      component?.updateProps(props);
      if (container) {
        positionMenu(container, props.clientRect?.() ?? null);
      }
    },

    onKeyDown: (props) => {
      if (props.event.key === 'Escape') {
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },

    onExit: () => {
      component?.destroy();
      container?.remove();
      component = null;
      container = null;
    },
  });
}
