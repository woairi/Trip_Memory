import { Link } from 'react-router-dom';
import type { Entry, Photo } from '../db/db';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { formatKoreanDate } from '../utils/date';

interface Props {
  entry: Entry;
  cover?: Photo;
  photoCount?: number;
}

export default function EntryCard({ entry, cover, photoCount }: Props) {
  const coverUrl = useObjectUrl(cover?.blob);

  return (
    <Link
      to={`/entry/${entry.id}`}
      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {coverUrl ? (
        <div className="relative aspect-[16/10] w-full bg-slate-100">
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          {photoCount && photoCount > 1 ? (
            <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
              📷 {photoCount}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{formatKoreanDate(entry.date)}</span>
          {entry.locationName ? (
            <span className="truncate text-sky-600">📍 {entry.locationName}</span>
          ) : null}
        </div>
        <h3 className="line-clamp-1 text-base font-semibold text-slate-800">
          {entry.title || '제목 없음'}
        </h3>
        {entry.body ? (
          <p className="line-clamp-2 whitespace-pre-wrap text-sm text-slate-500">
            {entry.body}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
