import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LocationPicker, { type LocationValue } from '../components/LocationPicker';
import PhotoUploader, { type DraftPhoto } from '../components/PhotoUploader';
import TagInput from '../components/TagInput';
import {
  createEntry,
  deleteEntry,
  getEntry,
  getPhotos,
  updateEntry,
  type EntryInput,
} from '../db/entries';
import { todayISO } from '../utils/date';
import { reverseGeocode } from '../utils/geocode';

export default function EntryEditor() {
  const { id } = useParams();
  const entryId = id ? Number(id) : undefined;
  const isEdit = entryId != null;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [date, setDate] = useState(() => searchParams.get('date') || todayISO());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState<LocationValue>({ locationName: '' });
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [photoGps, setPhotoGps] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entryId == null) return;
    let cancelled = false;
    (async () => {
      const entry = await getEntry(entryId);
      const existing = await getPhotos(entryId);
      if (cancelled || !entry) return;
      setDate(entry.date);
      setTitle(entry.title);
      setBody(entry.body);
      setLocation({
        locationName: entry.locationName ?? '',
        lat: entry.lat,
        lng: entry.lng,
      });
      setCity(entry.city ?? '');
      setCountry(entry.country ?? '');
      setTags(entry.tags ?? []);
      setPhotos(
        existing.map((p) => ({
          kind: 'existing',
          id: p.id!,
          blob: p.blob,
          caption: p.caption ?? '',
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  async function handleSave() {
    if (!date) {
      alert('날짜를 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const input: EntryInput = {
        date,
        title: title.trim(),
        body: body.trim(),
        locationName: location.locationName.trim() || undefined,
        lat: location.lat,
        lng: location.lng,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        tags,
      };
      const savePhotos = photos.map((p) => ({ blob: p.blob, caption: p.caption }));
      if (isEdit) {
        await updateEntry(entryId!, input, savePhotos);
        navigate(`/entry/${entryId}`);
      } else {
        const newId = await createEntry(input, savePhotos);
        navigate(`/entry/${newId}`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoFill() {
    if (location.lat == null || location.lng == null) {
      alert('먼저 지도에서 위치를 찍어주세요.');
      return;
    }
    setGeocoding(true);
    try {
      const region = await reverseGeocode(location.lat, location.lng);
      if (region.city) setCity(region.city);
      if (region.country) setCountry(region.country);
      if (!region.city && !region.country) {
        alert('이 위치의 도시·나라 정보를 찾지 못했어요. 직접 입력해 주세요.');
      }
    } catch {
      alert('자동 채우기를 사용할 수 없어요 (네트워크). 도시·나라를 직접 입력해 주세요.');
    } finally {
      setGeocoding(false);
    }
  }

  async function handleDelete() {
    if (entryId == null) return;
    if (!confirm('이 기록을 삭제할까요? 되돌릴 수 없습니다.')) return;
    await deleteEntry(entryId);
    navigate('/');
  }

  if (loading) {
    return <p className="py-10 text-center text-slate-400">불러오는 중…</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">
        {isEdit ? '기록 편집' : '오늘의 기록'}
      </h1>

      <Field label="날짜">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
        />
      </Field>

      <Field label="제목">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="오늘을 한 줄로 (예: 오랜만에 만난 친구)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
        />
      </Field>

      <Field label="장소 / 위치">
        {photoGps ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-700">
            <span>📷 사진에 촬영 위치 정보가 있어요.</span>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLocation((l) => ({
                    ...l,
                    lat: photoGps.lat,
                    lng: photoGps.lng,
                  }));
                  setPhotoGps(null);
                }}
                className="font-semibold underline"
              >
                이 위치 사용
              </button>
              <button
                type="button"
                onClick={() => setPhotoGps(null)}
                className="text-sky-400 hover:text-sky-600"
              >
                닫기
              </button>
            </div>
          </div>
        ) : null}
        <LocationPicker value={location} onChange={setLocation} />
      </Field>

      <Field label="도시 / 나라">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="도시 (예: 서울)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
          />
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="나라 (예: 대한민국)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={geocoding}
          className="mt-2 text-xs font-medium text-sky-600 hover:underline disabled:opacity-50"
        >
          {geocoding ? '불러오는 중…' : '📍 핀 위치로 도시·나라 자동 채우기'}
        </button>
      </Field>

      <Field label="태그">
        <TagInput tags={tags} onChange={setTags} />
      </Field>

      <Field label="사진">
        <PhotoUploader
          photos={photos}
          onChange={setPhotos}
          onLocationFound={(lat, lng) => setPhotoGps({ lat, lng })}
        />
      </Field>

      <Field label="느낌 · 감상 · 기억에 남는 일">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="오늘 어떤 하루였나요? 무엇이 가장 기억에 남았나요?"
          className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed focus:border-sky-400 focus:outline-none"
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        {isEdit ? (
          <button
            onClick={handleDelete}
            className="rounded-xl border border-rose-200 px-4 py-3 font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            삭제
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}
