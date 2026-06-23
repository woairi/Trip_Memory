export interface PhotoGps {
  lat: number;
  lng: number;
}

/**
 * JPEG EXIF에서 촬영 GPS 좌표를 읽는다. EXIF/GPS가 없거나 JPEG가 아니면 null.
 *
 * 주의: 캔버스 리사이즈(resizeImage)는 EXIF를 제거하므로, 반드시 리사이즈 전
 * 원본 File 에서 호출해야 한다. 외부 라이브러리 없이 EXIF/TIFF/GPS IFD만
 * 최소로 파싱한다(HEIC 등 비-JPEG는 미지원 → null, best-effort).
 */
export async function readGpsFromImage(file: File): Promise<PhotoGps | null> {
  try {
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);
    // JPEG SOI 마커
    if (view.byteLength < 12 || view.getUint16(0) !== 0xffd8) return null;

    const tiffStart = findExifTiffStart(view);
    if (tiffStart < 0) return null;

    // TIFF 헤더: 바이트 순서 (II=little, MM=big)
    const bo = view.getUint16(tiffStart);
    const little = bo === 0x4949;
    if (!little && bo !== 0x4d4d) return null;
    if (view.getUint16(tiffStart + 2, little) !== 0x002a) return null;

    // IFD0 → GPS IFD 포인터(0x8825)
    const ifd0 = tiffStart + view.getUint32(tiffStart + 4, little);
    const gpsPtr = readTagLong(view, ifd0, 0x8825, little);
    if (gpsPtr == null) return null;
    const gpsIfd = tiffStart + gpsPtr;

    const lat = readGpsCoord(view, gpsIfd, 0x0002, tiffStart, little);
    const lng = readGpsCoord(view, gpsIfd, 0x0004, tiffStart, little);
    if (lat == null || lng == null) return null;
    const latRef = readGpsRef(view, gpsIfd, 0x0001, little);
    const lngRef = readGpsRef(view, gpsIfd, 0x0003, little);

    const latDec = latRef === 'S' ? -lat : lat;
    const lngDec = lngRef === 'W' ? -lng : lng;
    if (!Number.isFinite(latDec) || !Number.isFinite(lngDec)) return null;
    // 좌표가 0,0 이거나 범위를 벗어나면 GPS 없음으로 간주
    if (latDec === 0 && lngDec === 0) return null;
    if (Math.abs(latDec) > 90 || Math.abs(lngDec) > 180) return null;
    return { lat: latDec, lng: lngDec };
  } catch {
    return null;
  }
}

/** APP1(Exif) 세그먼트를 찾아 TIFF 헤더 시작 오프셋을 돌려준다. 없으면 -1. */
function findExifTiffStart(view: DataView): number {
  let offset = 2;
  const len = view.byteLength;
  while (offset + 4 <= len) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint16(offset);
    // SOS(이미지 데이터 시작)/EOI 이후엔 메타데이터가 없다
    if (marker === 0xffda || marker === 0xffd9) break;
    const size = view.getUint16(offset + 2);
    if (size < 2) break;
    if (marker === 0xffe1 && offset + 10 <= len) {
      const exifStart = offset + 4;
      // "Exif\0\0"
      if (
        view.getUint32(exifStart) === 0x45786966 &&
        view.getUint16(exifStart + 4) === 0x0000
      ) {
        return exifStart + 6;
      }
    }
    offset += 2 + size;
  }
  return -1;
}

/** IFD에서 tag 를 가진 12바이트 엔트리의 시작 오프셋. 없으면 null. */
function findEntry(
  view: DataView,
  ifd: number,
  tag: number,
  little: boolean,
): number | null {
  const count = view.getUint16(ifd, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (view.getUint16(entry, little) === tag) return entry;
  }
  return null;
}

/** SHORT/LONG 단일 값을 읽는다 (GPS IFD 포인터 등). */
function readTagLong(
  view: DataView,
  ifd: number,
  tag: number,
  little: boolean,
): number | null {
  const entry = findEntry(view, ifd, tag, little);
  if (entry == null) return null;
  const type = view.getUint16(entry + 2, little);
  return type === 3
    ? view.getUint16(entry + 8, little) // SHORT
    : view.getUint32(entry + 8, little); // LONG
}

/** GPSLatitudeRef/LongitudeRef (ASCII 'N'/'S'/'E'/'W'). 인라인 저장. */
function readGpsRef(
  view: DataView,
  ifd: number,
  tag: number,
  little: boolean,
): string | null {
  const entry = findEntry(view, ifd, tag, little);
  if (entry == null) return null;
  return String.fromCharCode(view.getUint8(entry + 8)).toUpperCase();
}

/** GPSLatitude/Longitude: RATIONAL 3개(도,분,초) → 십진수 도. */
function readGpsCoord(
  view: DataView,
  ifd: number,
  tag: number,
  tiffStart: number,
  little: boolean,
): number | null {
  const entry = findEntry(view, ifd, tag, little);
  if (entry == null) return null;
  const type = view.getUint16(entry + 2, little);
  const count = view.getUint32(entry + 4, little);
  if (type !== 5 || count < 3) return null; // RATIONAL × 3
  // 3 RATIONAL = 24바이트 > 4바이트라 값은 오프셋으로 저장된다
  const valueOffset = tiffStart + view.getUint32(entry + 8, little);
  const parts: number[] = [];
  for (let i = 0; i < 3; i++) {
    const num = view.getUint32(valueOffset + i * 8, little);
    const den = view.getUint32(valueOffset + i * 8 + 4, little);
    if (den === 0) return null;
    parts.push(num / den);
  }
  return parts[0] + parts[1] / 60 + parts[2] / 3600;
}
