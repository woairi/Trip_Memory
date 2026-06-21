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
  tags: string[]; // 태그 (예: 맛집, 미술관)
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
    // v2: 태그(다중 값 인덱스) 추가, 기존 기록에는 빈 배열 채움
    this.version(2)
      .stores({
        entries: '++id, date, updatedAt, *tags',
        photos: '++id, entryId',
      })
      .upgrade((tx) =>
        tx
          .table('entries')
          .toCollection()
          .modify((e: Entry) => {
            if (!e.tags) e.tags = [];
          }),
      );
  }
}

export const db = new TripMemoryDB();
