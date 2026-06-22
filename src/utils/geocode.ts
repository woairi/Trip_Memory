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
