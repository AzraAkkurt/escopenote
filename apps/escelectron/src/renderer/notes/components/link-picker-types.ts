import type { LinkTargetKind } from '@shared/link-types';

export type LinkPickerTab = 'notes' | 'resources' | 'all';

export interface LinkPickerItem {
  kind: LinkTargetKind;
  id: string;
  label: string;
  subtitle?: string;
  badge?: string;
}

export const LINK_PICKER_BROWSE_ID = '__browse_all__';

export interface WikilinkSuggestionItem extends LinkPickerItem {
  isBrowseAll?: boolean;
}
