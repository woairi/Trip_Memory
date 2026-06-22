import { useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

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

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value.locationName}
        onChange={(e) => onChange({ ...value, locationName: e.target.value })}
        placeholder="장소 (예: 한강공원, 파리 에펠탑)"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
      />

      <div className="flex items-center gap-3 text-xs">
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
