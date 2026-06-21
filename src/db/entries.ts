import { db, type Entry, type Photo } from './db';

export interface EntryInput {
  date: string;
  title: string;
  body: string;
  locationName?: string;
  lat?: number;
  lng?: number;
}

/** 저장할 사진 한 장 (순서는 배열 인덱스로 결정) */
export interface SavePhoto {
  blob: Blob;
  caption?: string;
}

/** 새 기록 + 사진들을 한 트랜잭션으로 저장하고 entryId 반환 */
export async function createEntry(
  input: EntryInput,
  photos: SavePhoto[],
): Promise<number> {
  const now = Date.now();
  return db.transaction('rw', db.entries, db.photos, async () => {
    const entryId = await db.entries.add({
      ...input,
      createdAt: now,
      updatedAt: now,
    });
    await writePhotos(entryId, photos);
    return entryId;
  });
}

/**
 * 기록 본문 수정 + 사진 전체 교체.
 * 편집 화면이 넘겨준 사진 목록을 그대로 최종 상태로 만들어
 * 추가/삭제/순서변경/캡션수정을 한 번에 반영한다.
 */
export async function updateEntry(
  id: number,
  input: EntryInput,
  photos: SavePhoto[],
): Promise<void> {
  await db.transaction('rw', db.entries, db.photos, async () => {
    await db.entries.update(id, { ...input, updatedAt: Date.now() });
    await db.photos.where('entryId').equals(id).delete();
    await writePhotos(id, photos);
  });
}

/** 사진 목록을 배열 순서대로 저장 */
async function writePhotos(entryId: number, photos: SavePhoto[]): Promise<void> {
  if (photos.length === 0) return;
  const rows: Photo[] = photos.map((p, i) => ({
    entryId,
    blob: p.blob,
    caption: p.caption,
    order: i,
  }));
  await db.photos.bulkAdd(rows);
}

/** 기록과 딸린 사진 모두 삭제 */
export async function deleteEntry(id: number): Promise<void> {
  await db.transaction('rw', db.entries, db.photos, async () => {
    await db.photos.where('entryId').equals(id).delete();
    await db.entries.delete(id);
  });
}

export async function getEntry(id: number): Promise<Entry | undefined> {
  return db.entries.get(id);
}

/** 한 기록의 사진들을 순서대로 반환 */
export async function getPhotos(entryId: number): Promise<Photo[]> {
  const photos = await db.photos.where('entryId').equals(entryId).toArray();
  return photos.sort((a, b) => a.order - b.order);
}

/** 모든 기록을 날짜 내림차순(최신 우선)으로 반환 */
export async function listEntries(): Promise<Entry[]> {
  const entries = await db.entries.toArray();
  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.updatedAt - a.updatedAt;
  });
}

/** 기록별 대표(첫) 사진과 사진 개수를 반환 */
export async function getCoverPhotos(
  entryIds: number[],
): Promise<Map<number, { cover: Photo; count: number }>> {
  const map = new Map<number, { cover: Photo; count: number }>();
  for (const entryId of entryIds) {
    const photos = await db.photos.where('entryId').equals(entryId).toArray();
    if (photos.length === 0) continue;
    const cover = photos.reduce((a, b) => (a.order <= b.order ? a : b));
    map.set(entryId, { cover, count: photos.length });
  }
  return map;
}
