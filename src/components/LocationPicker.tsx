import { useEffect, useState } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { searchPlaces, type GeoPlace } from '../utils/geocode';

export interface LocationValue {
  locationName: string;
  lat?: number;
  lng?: number;
}

interface Props {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

// 기본 좌표 (지도 펼쳤을 때 시작 위치)
const DEFAULT_CENTER: [number, number] = [37.5665, 126.978]; // 서울

export default function LocationPicker({ value, onChange }: Props) {
  const hasPin = value.lat != null && value.lng != null;
  const [showMap, setShowMap] = useState(hasPin);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 검색: 입력한 장소명으로 좌표 후보를 찾는다.
  async function handleSearch() {
    const q = value.locationName.trim();
    if (!q) {
      setError('먼저 장소 이름을 입력하세요.');
      return;
    }
    setSearching(true);
    setError(null);
    setResults([]);
    try {
      const places = await searchPlaces(q);
      if (places.length === 0) {
        setError('검색 결과가 없어요. 다른 이름으로 시도해보세요.');
      } else if (places.length === 1) {
        pickPlace(places[0]);
      } else {
        setResults(places);
        setShowMap(true);
      }
    } catch {
      setError('검색에 실패했어요. 네트워크 상태를 확인하세요.');
    } finally {
      setSearching(false);
    }
  }

  function pickPlace(place: GeoPlace) {
    onChange({
      ...value,
      locationName: value.locationName.trim() || place.shortName,
      lat: place.lat,
      lng: place.lng,
    });
    setResults([]);
    setError(null);
    setShowMap(true);
  }

  // 현재 위치(GPS)로 핀을 찍는다.
  function handleCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setError('이 기기에서는 현재 위치를 사용할 수 없어요.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          ...value,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setResults([]);
        setShowMap(true);
        setLocating(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? '위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.'
            : '현재 위치를 가져오지 못했어요.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value.locationName}
          onChange={(e) => onChange({ ...value, locationName: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="장소 (예: 한강공원, 파리 에펠탑)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="shrink-0 rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {searching ? '검색 중…' : '🔍 검색'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={locating}
          className="font-medium text-sky-600 hover:underline disabled:opacity-50"
        >
          {locating ? '위치 찾는 중…' : '📍 현재 위치 사용'}
        </button>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="font-medium text-sky-600 hover:underline"
        >
          {showMap ? '지도 접기' : '🗺️ 지도에서 위치 찍기'}
        </button>
        {hasPin ? (
          <button
            type="button"
            onClick={() => onChange({ ...value, lat: undefined, lng: undefined })}
            className="text-slate-400 hover:text-rose-500"
          >
            핀 제거
          </button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-rose-500">{error}</p> : null}

      {results.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {results.map((place, i) => (
            <li key={`${place.lat},${place.lng},${i}`}>
              <button
                type="button"
                onClick={() => pickPlace(place)}
                className="block w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-sky-50"
              >
                {place.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showMap ? (
        <div className="h-56 overflow-hidden rounded-xl border border-slate-200">
          <MapContainer
            center={hasPin ? [value.lat!, value.lng!] : DEFAULT_CENTER}
            zoom={hasPin ? 13 : 10}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler
              onPick={(lat, lng) => onChange({ ...value, lat, lng })}
            />
            <Recenter lat={value.lat} lng={value.lng} />
            {hasPin ? <Marker position={[value.lat!, value.lng!]} /> : null}
          </MapContainer>
        </div>
      ) : null}

      {hasPin ? (
        <p className="text-xs text-slate-400">
          위도 {value.lat!.toFixed(4)}, 경도 {value.lng!.toFixed(4)}
        </p>
      ) : (
        showMap && (
          <p className="text-xs text-slate-400">지도를 눌러 위치를 표시하세요.</p>
        )
      )}
    </div>
  );
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// 핀 좌표가 바뀌면(검색·현재위치 등) 지도를 그 위치로 부드럽게 이동시킨다.
function Recenter({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    }
  }, [lat, lng, map]);
  return null;
}
