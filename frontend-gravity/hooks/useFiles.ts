import { useApi } from './useApi';
import { api } from '@/lib/api';
import type { CloudSyncResponse, FilesOverviewResponse } from '@/types/files';

export function useFilesOverview() {
  return useApi<FilesOverviewResponse>('/files');
}

export async function updateFileShare(
  fileId: string,
  data: { studentIds: string[]; applyToChildren?: boolean },
) {
  return api(`/files/${fileId}/share`, {
    method: 'PATCH',
    body: data,
  });
}

export async function syncYandexDiskFiles() {
  return api<CloudSyncResponse>('/files/yandex-disk/sync', {
    method: 'POST',
  });
}

export async function syncYandexDiskFolder(folderId: string) {
  return api<CloudSyncResponse>(`/files/yandex-disk/sync-folder/${folderId}`, {
    method: 'POST',
  });
}

export async function syncGoogleDriveFiles() {
  return api<CloudSyncResponse>('/files/google-drive/sync', {
    method: 'POST',
  });
}

export async function syncGoogleDriveFolder(folderId: string) {
  return api<CloudSyncResponse>(`/files/google-drive/sync-folder/${folderId}`, {
    method: 'POST',
  });
}
