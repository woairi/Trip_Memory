import Dexie, { type Table } from 'dexie';

/** 하루치 여행 기록(일기) */
export interface Entry {
  id?: number;
  date: string; // 'YYYY-MM-DD'
  title: string;
  body: string; // 느낌 / 감상 / 기억에 남는 일
  locationName?: string;
  lat?: number;
  lng?: number;
  createdAt: number;
  updatedAt: number;
}

/** 기록에 첨부된 사진 (실제 이미지는 Blob으로 저장) */
export interface Photo {
  id?: number;
  entryId: number;
  blob: Blob;
  caption?: string;
  order: number;
}

export class TripMemoryDB extends Dexie {
  entries!: Table<Entry, number>;
  photos!: Table<Photo, number>;

  constructor() {
    super('trip-memory');
    this.version(1).stores({
      entries: '++id, date, updatedAt',
      photos: '++id, entryId',
    });
  }
}

export const db = new TripMemoryDB();
