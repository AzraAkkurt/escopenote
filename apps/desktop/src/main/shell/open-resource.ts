import { shell } from 'electron';
import { IpcError } from '../../../shared/ipc-errors';
import type { Resource } from '../../../shared/resource-types';
import { isFileResource, isLinkResource } from '../../../shared/resource-types';
import { getResource } from '../resources/resource-service';

export async function openResourceById(resourceId: string): Promise<void> {
  const resource = await getResource(resourceId);

  if (isFileResource(resource)) {
    const err = await shell.openPath(resource.path);
    if (err) {
      throw new IpcError('VALIDATION_ERROR', err);
    }
    return;
  }

  if (isLinkResource(resource)) {
    await shell.openExternal(resource.url);
    return;
  }

  throw new IpcError('VALIDATION_ERROR', 'Cannot open note resources as files; open the note instead');
}

export async function openResourceTarget(resource: Resource): Promise<void> {
  return openResourceById(resource.id);
}
