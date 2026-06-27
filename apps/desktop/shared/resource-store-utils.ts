import type { Resource, ResourcesStore } from './resource-types';

export const EMPTY_RESOURCES: ResourcesStore = { resources: [] };

function isValidResource(r: unknown): r is Resource {
  if (!r || typeof r !== 'object') {
    return false;
  }
  const obj = r as Resource;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.kind === 'string' &&
    ['file', 'link', 'note'].includes(obj.kind)
  );
}

export function normalizeResourcesStore(data: unknown): ResourcesStore {
  if (!data || typeof data !== 'object') {
    return EMPTY_RESOURCES;
  }
  const raw = data as Partial<ResourcesStore>;
  if (!Array.isArray(raw.resources)) {
    return EMPTY_RESOURCES;
  }
  return { resources: raw.resources.filter(isValidResource) };
}
