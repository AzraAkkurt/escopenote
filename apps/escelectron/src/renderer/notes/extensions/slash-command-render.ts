import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import {
  SlashCommandList,
  type SlashCommandListRef,
} from '@renderer/notes/components/SlashCommandList';
import type { SlashCommandGroup, SlashCommandItem } from '@renderer/notes/extensions/slash-commands';

function positionMenu(el: HTMLElement, rect: DOMRect | null) {
  if (!rect) {
    return;
  }
  el.style.position = 'fixed';
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.bottom + 6}px`;
  el.style.zIndex = '1000';
}

export function createSlashCommandRender(
  groupLabels: Record<SlashCommandGroup, string>,
): NonNullable<SuggestionOptions<SlashCommandItem>['render']> {
  let component: ReactRenderer<SlashCommandListRef> | null = null;
  let container: HTMLDivElement | null = null;

  return () => ({
    onStart: (props) => {
      container = document.createElement('div');
      container.className = 'slash-menu-portal';
      document.body.appendChild(container);

      component = new ReactRenderer(SlashCommandList, {
        props: { ...props, groupLabels },
        editor: props.editor,
      });

      container.appendChild(component.element);
      positionMenu(container, props.clientRect?.() ?? null);
    },

    onUpdate: (props) => {
      component?.updateProps({ ...props, groupLabels });
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
