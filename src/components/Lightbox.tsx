import { useEffect } from 'react';
import type { Photo } from '../db/db';
import { useObjectUrl } from '../hooks/useObjectUrl';

interface Props {
  photos: Photo[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}

/** 전체화면으로 사진을 크게 보고 좌우로 넘기는 라이트박스 */
export default function Lightbox({ photos, index, onIndex, onClose }: Props) {
  const photo = photos[index];
  const url = useObjectUrl(photo?.blob);
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      else if (e.key === 'ArrowRight' && index < photos.length - 1)
        onIndex(index + 1);
    }
    window.addEventListener('keydown', onKey);
    // 라이트박스가 열린 동안 배경 스크롤 잠금
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, photos.length, onClose, onIndex]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* 상단 바 */}
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm text-white/70">
          {index + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      {/* 이미지 영역 */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
        {url ? (
          <img
            src={url}
            alt={photo.caption ?? ''}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : null}

        {hasPrev ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndex(index - 1);
            }}
            aria-label="이전 사진"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ‹
          </button>
        ) : null}
        {hasNext ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndex(index + 1);
            }}
            aria-label="다음 사진"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ›
          </button>
        ) : null}
      </div>

      {/* 캡션 */}
      {photo.caption ? (
        <p className="p-4 text-center text-sm text-white/80">{photo.caption}</p>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
}
