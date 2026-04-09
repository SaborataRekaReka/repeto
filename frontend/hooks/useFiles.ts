import { useApi } from './useApi';
import { api } from '@/lib/api';
import type { FilesOverviewResponse } from '@/types/files';

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
  return api('/files/yandex-disk/sync', {
    method: 'POST',
  });
}
