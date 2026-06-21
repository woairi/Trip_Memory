import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import EntryCard from '../components/EntryCard';
import { getCoverPhotos, listEntries } from '../db/entries';

export default function Timeline() {
  const data = useLiveQuery(async () => {
    const entries = await listEntries();
    const covers = await getCoverPhotos(
      entries.map((e) => e.id!).filter((id) => id != null),
    );
    return { entries, covers };
  }, []);

  if (!data) {
    return <p className="py-10 text-center text-slate-400">불러오는 중…</p>;
  }

  if (data.entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-5xl">🗺️</span>
        <div>
          <p className="text-lg font-semibold text-slate-700">
            아직 기록이 없어요
          </p>
          <p className="mt-1 text-sm text-slate-400">
            유럽에서의 오늘을 사진과 함께 남겨보세요.
          </p>
        </div>
        <Link
          to="/entry/new"
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          첫 기록 추가하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.entries.map((entry) => {
        const cover = data.covers.get(entry.id!);
        return (
          <EntryCard
            key={entry.id}
            entry={entry}
            cover={cover?.cover}
            photoCount={cover?.count}
          />
        );
      })}
    </div>
  );
}
