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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <Thumb
            key={photo.kind === 'existing' ? `e${photo.id}` : `n${i}`}
            photo={photo}
            onRemove={() => remove(i)}
            onCaption={(c) => setCaption(i, c)}
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
  onRemove,
  onCaption,
}: {
  photo: DraftPhoto;
  onRemove: () => void;
  onCaption: (caption: string) => void;
}) {
  const url = useObjectUrl(photo.blob);
  return (
    <div className="space-y-1">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
        <button
          type="button"
          onClick={onRemove}
          aria-label="사진 삭제"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-sm text-white hover:bg-black/75"
        >
          ✕
        </button>
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
