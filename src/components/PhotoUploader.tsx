import { useRef, useState } from 'react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { resizeImage } from '../utils/image';

/** 편집 중인 사진 한 장. 기존 사진(existing)과 새로 추가한 사진(new)을 구분한다. */
export type DraftPhoto =
  | { kind: 'existing'; id: number; blob: Blob; caption: string }
  | { kind: 'new'; blob: Blob; caption: string };

interface Props {
  photos: DraftPhoto[];
  onChange: (photos: DraftPhoto[]) => void;
}

export default function PhotoUploader({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    try {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      const added: DraftPhoto[] = [];
      for (const file of files) {
        const blob = await resizeImage(file);
        added.push({ kind: 'new', blob, caption: '' });
      }
      onChange([...photos, ...added]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function setCaption(index: number, caption: string) {
    onChange(photos.map((p, i) => (i === index ? { ...p, caption } : p)));
  }

  /** from 위치의 사진을 to 위치로 이동 */
  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function handleDrop(target: number) {
    if (dragIndex !== null) move(dragIndex, target);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <Thumb
            key={photo.kind === 'existing' ? `e${photo.id}` : `n${i}`}
            photo={photo}
            index={i}
            total={photos.length}
            isDragging={dragIndex === i}
            isOver={overIndex === i && dragIndex !== i}
            onRemove={() => remove(i)}
            onCaption={(c) => setCaption(i, c)}
            onMove={(dir) => move(i, i + dir)}
            onDragStart={() => setDragIndex(i)}
            onDragEnter={() => setOverIndex(i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
          />
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-sky-400 hover:text-sky-500 disabled:opacity-50"
        >
          <span className="text-2xl">{busy ? '⏳' : '＋'}</span>
          <span className="text-xs">{busy ? '처리 중…' : '사진 추가'}</span>
        </button>
      </div>

      {photos.length > 1 ? (
        <p className="text-xs text-slate-400">
          사진을 끌어 순서를 바꿀 수 있어요. 첫 번째 사진이 대표가 됩니다.
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function Thumb({
  photo,
  index,
  total,
  isDragging,
  isOver,
  onRemove,
  onCaption,
  onMove,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
}: {
  photo: DraftPhoto;
  index: number;
  total: number;
  isDragging: boolean;
  isOver: boolean;
  onRemove: () => void;
  onCaption: (caption: string) => void;
  onMove: (dir: -1 | 1) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const url = useObjectUrl(photo.blob);
  return (
    <div className="space-y-1">
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`relative aspect-square cursor-move overflow-hidden rounded-xl bg-slate-100 transition-all ${
          isDragging ? 'opacity-40' : ''
        } ${isOver ? 'ring-2 ring-sky-400' : ''}`}
      >
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}

        {/* 순서 배지 / 대표 표시 */}
        <span className="absolute left-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {index === 0 ? '대표' : index + 1}
        </span>

        <button
          type="button"
          onClick={onRemove}
          aria-label="사진 삭제"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-sm text-white hover:bg-black/75"
        >
          ✕
        </button>

        {/* 모바일용 좌우 이동 버튼 */}
        {total > 1 ? (
          <div className="absolute inset-x-1 bottom-1 flex justify-between">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label="앞으로 이동"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white disabled:opacity-30"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              aria-label="뒤로 이동"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white disabled:opacity-30"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>
      <input
        type="text"
        value={photo.caption}
        onChange={(e) => onCaption(e.target.value)}
        placeholder="사진 설명"
        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-sky-400 focus:outline-none"
      />
    </div>
  );
}
