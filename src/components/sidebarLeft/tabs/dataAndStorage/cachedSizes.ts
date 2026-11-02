import {
  cachedFilesStorageName,
  cachedVideoChunksStorageNames,
  HTTPHeaderNames
} from '@lib/constants';
import CacheStorageController from '@lib/files/cacheStorage';

/**
 * The cached-data size collectors the storage quota tab shows
 * (Settings → Data & Storage). Extracted from `storageQuota.tsx` so the pill
 * stack's cache pill (PILLS-06) reads the same numbers instead of keeping a
 * second implementation.
 */

type CollectedCategory = 'images' | 'videos' | 'stickers' | 'other';

export type CollectedCachedFilesSizes = {
  totalSize: number,
  collectedSizeByTypes: Record<CollectedCategory, number>
};

function getContentSizeFromHeaders(headers: Headers): number {
  const contentSize = parseInt(headers.get(HTTPHeaderNames.contentLength) || '0');
  if(!contentSize) return 0;

  return contentSize;
}

export async function collectCachedFilesSizes(): Promise<CollectedCachedFilesSizes> {
  const collectedSizeByTypes: Record<CollectedCategory, number> = {
    images: 0,
    videos: 0,
    stickers: 0,
    other: 0
  };
  let totalSize = 0;

  const storage = new CacheStorageController(cachedFilesStorageName);

  await storage.minimalBlockingIterateResponses(({response}) => {
    const headers = response.headers;

    const contentSize = getContentSizeFromHeaders(headers);
    if(!contentSize) return;

    const contentType = headers.get('content-type');

    const category: CollectedCategory =
      contentType?.startsWith('image/') ? 'images' :
        contentType?.startsWith('video/') ? 'videos' :
          contentType?.startsWith('application/json') ? 'stickers' : 'other';

    collectedSizeByTypes[category] += contentSize;
    totalSize += contentSize;
  }).finally(() => {
    storage.forget();
  });

  return {
    totalSize,
    collectedSizeByTypes
  };
}

export async function collectCachedVideoStreamChunksSize(): Promise<number> {
  let totalSize = 0;

  for(const storageName of cachedVideoChunksStorageNames) {
    const storage = new CacheStorageController(storageName);

    await storage.minimalBlockingIterateResponses(({response}) => {
      const contentSize = getContentSizeFromHeaders(response.headers);
      totalSize += contentSize;
    }).finally(() => {
      storage.forget();
    });
  }

  return totalSize;
}
