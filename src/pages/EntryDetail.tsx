import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Lightbox from '../components/Lightbox';
import type { Photo } from '../db/db';
import { getEntry, getPhotos } from '../db/entries';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { formatKoreanDate } from '../utils/date';

export default function EntryDetail() {
  const { id } = useParams();
  const entryId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const data = useLiveQuery(async () => {
    if (entryId == null) return null;
    const entry = await getEntry(entryId);
    if (!entry) return null;
    const photos = await getPhotos(entryId);
    return { entry, photos };
  }, [entryId]);

  if (data === undefined) {
    return <p className="py-10 text-center text-slate-400">불러오는 중…</p>;
  }

  if (data === null) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">기록을 찾을 수 없어요.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
          타임라인으로
        </Link>
      </div>
    );
  }

  const { entry, photos } = data;
  const hasPin = entry.lat != null && entry.lng != null;

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          ‹ 뒤로
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">{formatKoreanDate(entry.date)}</p>
            <h1 className="text-2xl font-bold text-slate-800">
              {entry.title || '제목 없음'}
            </h1>
            {entry.locationName ? (
              <p className="mt-1 text-sm text-sky-600">📍 {entry.locationName}</p>
            ) : null}
          </div>
          <Link
            to={`/entry/${entry.id}/edit`}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            편집
          </Link>
        </div>
      </header>

      {entry.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((t) => (
            <Link
              key={t}
              to={`/?tag=${encodeURIComponent(t)}`}
              className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              #{t}
            </Link>
          ))}
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div className="space-y-3">
          {photos.map((photo, i) => (
            <PhotoView
              key={photo.id}
              photo={photo}
              onOpen={() => setLightboxIndex(i)}
            />
          ))}
        </div>
      ) : null}

      {entry.body ? (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
          {entry.body}
        </p>
      ) : null}

      {hasPin ? (
        <div className="h-64 overflow-hidden rounded-2xl border border-slate-200">
          <MapContainer
            center={[entry.lat!, entry.lng!]}
            zoom={13}
            className="h-full w-full"
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[entry.lat!, entry.lng!]} />
          </MapContainer>
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </article>
  );
}

function PhotoView({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  const url = useObjectUrl(photo.blob);
  return (
    <figure className="overflow-hidden rounded-2xl bg-slate-100">
      {url ? (
        <button type="button" onClick={onOpen} className="block w-full">
          <img
            src={url}
            alt={photo.caption ?? ''}
            className="w-full cursor-zoom-in"
          />
        </button>
      ) : null}
      {photo.caption ? (
        <figcaption className="px-3 py-2 text-sm text-slate-500">
          {photo.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
