import { db, type Entry, type Photo } from './db';
import { blobToDataUrl, dataUrlToBlob } from '../utils/backup';

export interface EntryInput {
  date: string;
  title: string;
  body: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
  tags: string[];
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

/**
 * 검색어 + 태그로 기록을 필터링한다 (날짜 내림차순).
 * - query: 제목·본문·장소·태그에 대소문자 무시 부분일치
 * - tag: 정확히 일치하는 태그를 가진 기록만
 */
export async function searchEntries(
  query: string,
  tag?: string,
): Promise<Entry[]> {
  const all = await listEntries();
  const q = query.trim().toLowerCase();
  return all.filter((e) => {
    if (tag && !e.tags.includes(tag)) return false;
    if (!q) return true;
    const haystack = [
      e.title,
      e.body,
      e.locationName ?? '',
      e.tags.join(' '),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/** 사용된 모든 태그를 빈도 내림차순으로 반환 */
export async function listAllTags(): Promise<string[]> {
  const all = await db.entries.toArray();
  const counts = new Map<string, number>();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
}

// ---- 백업 / 복원 ----

const BACKUP_VERSION = 1;

export interface BackupPhoto {
  caption?: string;
  order: number;
  dataUrl: string;
}

export interface BackupEntry {
  date: string;
  title: string;
  body: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  photos: BackupPhoto[];
}

export interface BackupFile {
  app: 'trip-memory';
  version: number;
  exportedAt: string;
  entries: BackupEntry[];
}

/** 모든 기록과 사진(base64)을 백업 객체로 직렬화 */
export async function exportAll(): Promise<BackupFile> {
  const entries = await listEntries();
  const out: BackupEntry[] = [];
  for (const e of entries) {
    const photos = await getPhotos(e.id!);
    const backupPhotos: BackupPhoto[] = [];
    for (const p of photos) {
      backupPhotos.push({
        caption: p.caption,
        order: p.order,
        dataUrl: await blobToDataUrl(p.blob),
      });
    }
    out.push({
      date: e.date,
      title: e.title,
      body: e.body,
      locationName: e.locationName,
      lat: e.lat,
      lng: e.lng,
      city: e.city,
      country: e.country,
      tags: e.tags ?? [],
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      photos: backupPhotos,
    });
  }
  return {
    app: 'trip-memory',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    entries: out,
  };
}

/**
 * 백업 객체에서 기록을 복원한다.
 * - replace=true: 기존 데이터를 모두 지우고 가져옴
 * - replace=false: 기존 데이터에 이어서 추가
 * 반환값: 가져온 기록 수
 */
export async function importAll(data: BackupFile, replace: boolean): Promise<number> {
  if (!data || data.app !== 'trip-memory' || !Array.isArray(data.entries)) {
    throw new Error('올바른 Trip Memory 백업 파일이 아니에요.');
  }

  // Dexie 트랜잭션 중에는 비-Dexie await(이미지 디코드)가 트랜잭션을 닫을 수 있으므로
  // 사진 Blob 변환을 트랜잭션 시작 전에 모두 끝내 둔다.
  const prepared = await Promise.all(
    data.entries.map(async (be) => {
      const entry: Entry = {
        date: be.date,
        title: be.title ?? '',
        body: be.body ?? '',
        locationName: be.locationName,
        lat: be.lat,
        lng: be.lng,
        city: be.city,
        country: be.country,
        tags: be.tags ?? [],
        createdAt: be.createdAt ?? Date.now(),
        updatedAt: be.updatedAt ?? Date.now(),
      };
      const photos = await Promise.all(
        (be.photos ?? []).map(async (p, i) => ({
          blob: await dataUrlToBlob(p.dataUrl),
          caption: p.caption,
          order: p.order ?? i,
        })),
      );
      return { entry, photos };
    }),
  );

  await db.transaction('rw', db.entries, db.photos, async () => {
    if (replace) {
      await db.photos.clear();
      await db.entries.clear();
    }
    for (const item of prepared) {
      const entryId = await db.entries.add(item.entry);
      if (item.photos.length > 0) {
        await db.photos.bulkAdd(item.photos.map((p) => ({ ...p, entryId })));
      }
    }
  });

  return prepared.length;
}

/** 기록 개수 */
export async function countEntries(): Promise<number> {
  return db.entries.count();
}

/** 위치(좌표)가 있는 기록을 날짜 오름차순(여행 경로 순)으로 반환 */
export async function listLocatedEntries(): Promise<Entry[]> {
  const all = await db.entries.toArray();
  return all
    .filter((e) => e.lat != null && e.lng != null)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.createdAt - b.createdAt;
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
