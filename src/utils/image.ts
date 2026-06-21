/**
 * 이미지 파일을 긴 변 기준 maxSize 픽셀로 리사이즈하여 JPEG Blob으로 반환한다.
 * IndexedDB 용량 절약 목적. 디코딩 실패 시 원본 Blob을 그대로 반환한다.
 */
export async function resizeImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    return blob ?? file;
  } catch {
    // HEIC 등 디코딩 불가 포맷은 원본 그대로 저장
    return file;
  }
}
