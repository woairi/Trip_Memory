import { useLiveQuery } from 'dexie-react-hooks';
import L from 'leaflet';
import { useEffect } from 'react';
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

const EUROPE_CENTER: [number, number] = [48.8566, 2.3522];

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

  if (!entries) {
    return <p className="py-10 text-center text-slate-400">불러오는 중…</p>;
  }

  const points: [number, number][] = entries.map((e) => [e.lat!, e.lng!]);

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
        <h1 className="text-xl font-bold text-slate-800">여행 지도</h1>
        <span className="text-sm text-slate-400">위치 {entries.length}곳</span>
      </div>

      <div className="h-[70vh] overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={points[0] ?? EUROPE_CENTER}
          zoom={5}
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

          {entries.map((entry, i) => (
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
        번호는 날짜순 방문 순서예요. 핀을 누르면 해당 기록으로 이동할 수 있어요.
      </p>
    </div>
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
      <Link
        to={`/entry/${entry.id}`}
        className="mt-1 inline-block text-xs font-medium text-sky-600 hover:underline"
      >
        기록 보기 →
      </Link>
    </div>
  );
}
