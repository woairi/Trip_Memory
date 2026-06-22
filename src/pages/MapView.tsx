import { useLiveQuery } from 'dexie-react-hooks';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { Link } from 'react-router-dom';
import type { Entry } from '../db/db';
import { listLocatedEntries } from '../db/entries';
import { formatKoreanDate } from '../utils/date';

const DEFAULT_CENTER: [number, number] = [37.5665, 126.978]; // 서울
const ALL = '전체';
const NO_COUNTRY = '미분류';
const NO_CITY = '기타';

// 경로 순번이 적힌 핀 아이콘
function numberedIcon(n: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:9999px;
      background:#0ea5e9;color:#fff;font-size:13px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);
    ">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// 마커 좌표 전체가 보이도록 지도 범위를 맞춘다
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    map.fitBounds(points, { padding: [48, 48] });
  }, [points, map]);
  return null;
}

export default function MapView() {
  const entries = useLiveQuery(() => listLocatedEntries(), []);
  const [country, setCountry] = useState(ALL);
  const [city, setCity] = useState(ALL);

  const all = entries ?? [];

  // 나라별 개수 (기록 순서 유지 위해 등장 순서대로)
  const countries = useMemo(() => {
    const order: string[] = [];
    const counts = new Map<string, number>();
    for (const e of all) {
      const c = e.country?.trim() || NO_COUNTRY;
      if (!counts.has(c)) order.push(c);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return order.map((c) => ({ name: c, count: counts.get(c)! }));
  }, [all]);

  // 선택한 나라 안의 도시 목록
  const cities = useMemo(() => {
    if (country === ALL) return [];
    const order: string[] = [];
    const counts = new Map<string, number>();
    for (const e of all) {
      if ((e.country?.trim() || NO_COUNTRY) !== country) continue;
      const ci = e.city?.trim() || NO_CITY;
      if (!counts.has(ci)) order.push(ci);
      counts.set(ci, (counts.get(ci) ?? 0) + 1);
    }
    return order.map((c) => ({ name: c, count: counts.get(c)! }));
  }, [all, country]);

  const filtered = useMemo(
    () =>
      all.filter((e) => {
        if (country !== ALL && (e.country?.trim() || NO_COUNTRY) !== country)
          return false;
        if (city !== ALL && (e.city?.trim() || NO_CITY) !== city) return false;
        return true;
      }),
    [all, country, city],
  );

  if (!entries) {
    return <p className="py-10 text-center text-slate-400">불러오는 중…</p>;
  }

  const points: [number, number][] = filtered.map((e) => [e.lat!, e.lng!]);

  function selectCountry(name: string) {
    setCountry((prev) => (prev === name ? ALL : name));
    setCity(ALL);
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-5xl">🗺️</span>
        <div>
          <p className="text-lg font-semibold text-slate-700">
            지도에 표시할 위치가 없어요
          </p>
          <p className="mt-1 text-sm text-slate-400">
            기록을 작성할 때 지도에서 위치를 찍으면 여기에 경로로 모여요.
          </p>
        </div>
        <Link
          to="/entry/new"
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          기록 추가하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">지도</h1>
        <span className="text-sm text-slate-400">
          위치 {filtered.length}
          {filtered.length !== entries.length ? ` / ${entries.length}` : ''}곳
        </span>
      </div>

      {/* 나라 필터 */}
      {countries.length > 1 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterChip
            label={ALL}
            active={country === ALL}
            onClick={() => selectCountry(ALL)}
          />
          {countries.map((c) => (
            <FilterChip
              key={c.name}
              label={`${c.name} ${c.count}`}
              active={country === c.name}
              onClick={() => selectCountry(c.name)}
            />
          ))}
        </div>
      ) : null}

      {/* 선택한 나라의 도시 필터 */}
      {cities.length > 1 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterChip
            label={ALL}
            active={city === ALL}
            onClick={() => setCity(ALL)}
            subtle
          />
          {cities.map((c) => (
            <FilterChip
              key={c.name}
              label={`${c.name} ${c.count}`}
              active={city === c.name}
              onClick={() => setCity((prev) => (prev === c.name ? ALL : c.name))}
              subtle
            />
          ))}
        </div>
      ) : null}

      <div className="h-[70vh] overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={points[0] ?? DEFAULT_CENTER}
          zoom={10}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />

          {/* 날짜순 이동 경로 */}
          {points.length > 1 ? (
            <Polyline
              positions={points}
              pathOptions={{ color: '#0ea5e9', weight: 3, opacity: 0.7, dashArray: '6 8' }}
            />
          ) : null}

          {filtered.map((entry, i) => (
            <Marker
              key={entry.id}
              position={[entry.lat!, entry.lng!]}
              icon={numberedIcon(i + 1)}
            >
              <Popup>
                <MarkerPopup entry={entry} index={i + 1} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="text-center text-xs text-slate-400">
        번호는 날짜순이에요. 핀을 누르면 해당 기록으로 이동할 수 있어요.
      </p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  subtle,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  subtle?: boolean;
}) {
  const base =
    'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors';
  const cls = active
    ? subtle
      ? 'bg-slate-700 text-white'
      : 'bg-sky-600 text-white'
    : subtle
      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      : 'bg-sky-50 text-sky-700 hover:bg-sky-100';
  return (
    <button onClick={onClick} className={`${base} ${cls}`}>
      {label}
    </button>
  );
}

function MarkerPopup({ entry, index }: { entry: Entry; index: number }) {
  return (
    <div className="min-w-[10rem]">
      <p className="text-xs text-slate-400">
        {index}. {formatKoreanDate(entry.date)}
      </p>
      <p className="font-semibold text-slate-800">{entry.title || '제목 없음'}</p>
      {entry.locationName ? (
        <p className="text-xs text-sky-600">📍 {entry.locationName}</p>
      ) : null}
      {entry.city || entry.country ? (
        <p className="text-xs text-slate-400">
          {[entry.city, entry.country].filter(Boolean).join(', ')}
        </p>
      ) : null}
      <Link
        to={`/entry/${entry.id}`}
        className="mt-1 inline-block text-xs font-medium text-sky-600 hover:underline"
      >
        기록 보기 →
      </Link>
    </div>
  );
}
