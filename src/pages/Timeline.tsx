import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useSearchParams } from 'react-router-dom';
import EntryCard from '../components/EntryCard';
import { getCoverPhotos, listAllTags, searchEntries } from '../db/entries';

export default function Timeline() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const tag = params.get('tag') ?? '';

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const data = useLiveQuery(async () => {
    const entries = await searchEntries(q, tag || undefined);
    const allTags = await listAllTags();
    const covers = await getCoverPhotos(
      entries.map((e) => e.id!).filter((id) => id != null),
    );
    return { entries, covers, allTags };
  }, [q, tag]);

  const hasFilter = q.trim() !== '' || tag !== '';

  return (
    <div className="space-y-4">
      {/* 검색창 */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="제목 · 내용 · 장소 · 태그 검색"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-sky-400 focus:outline-none"
        />
      </div>

      {/* 태그 필터 칩 */}
      {data && data.allTags.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {tag ? (
            <button
              onClick={() => setParam('tag', '')}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              전체
            </button>
          ) : null}
          {data.allTags.map((t) => {
            const active = t === tag;
            return (
              <button
                key={t}
                onClick={() => setParam('tag', active ? '' : t)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      ) : null}

      {!data ? (
        <p className="py-10 text-center text-slate-400">불러오는 중…</p>
      ) : data.entries.length === 0 ? (
        hasFilter ? (
          <div className="py-16 text-center">
            <p className="text-slate-500">검색 결과가 없어요.</p>
            <button
              onClick={() => setParams({}, { replace: true })}
              className="mt-3 text-sm text-sky-600 hover:underline"
            >
              검색·필터 초기화
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span className="text-5xl">🗺️</span>
            <div>
              <p className="text-lg font-semibold text-slate-700">
                아직 기록이 없어요
              </p>
              <p className="mt-1 text-sm text-slate-400">
                오늘 하루를 사진과 함께 남겨보세요.
              </p>
            </div>
            <Link
              to="/entry/new"
              className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              첫 기록 추가하기
            </Link>
          </div>
        )
      ) : (
        data.entries.map((entry) => {
          const cover = data.covers.get(entry.id!);
          return (
            <EntryCard
              key={entry.id}
              entry={entry}
              cover={cover?.cover}
              photoCount={cover?.count}
            />
          );
        })
      )}
    </div>
  );
}
