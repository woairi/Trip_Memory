export interface GeoRegion {
  city?: string;
  country?: string;
}

/**
 * 좌표 → 도시/나라 (OpenStreetMap Nominatim 역지오코딩).
 * 네트워크 정책으로 차단될 수 있으므로 best-effort이며, 실패 시 throw 한다.
 * 호출 측에서 try/catch 로 감싸 사용한다.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoRegion> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${lat}&lon=${lng}&zoom=10&accept-language=ko`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`geocode failed: ${res.status}`);
  const data = await res.json();
  const a = data.address ?? {};
  const city =
    a.city || a.town || a.village || a.municipality || a.county || undefined;
  const country = a.country || undefined;
  return { city, country };
}

export interface GeoPlace {
  /** 사람이 읽을 전체 주소 (예: "에펠탑, 파리, 프랑스") */
  displayName: string;
  /** 짧은 이름 (display_name 첫 토막, 입력칸 자동 채우기용) */
  shortName: string;
  lat: number;
  lng: number;
}

/**
 * 장소 이름/주소 → 좌표 후보 목록 (OpenStreetMap Nominatim 정방향 지오코딩).
 * 네트워크 정책으로 차단될 수 있으므로 best-effort이며, 실패 시 throw 한다.
 * 호출 측에서 try/catch 로 감싸 사용한다.
 */
export async function searchPlaces(
  query: string,
  limit = 5,
): Promise<GeoPlace[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2` +
    `&q=${encodeURIComponent(q)}&limit=${limit}&accept-language=ko`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  return list
    .map((d): GeoPlace | null => {
      const lat = parseFloat(d.lat);
      const lng = parseFloat(d.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const displayName: string = d.display_name ?? '';
      return {
        displayName,
        shortName: displayName.split(',')[0]?.trim() || displayName,
        lat,
        lng,
      };
    })
    .filter((p): p is GeoPlace => p !== null);
}
