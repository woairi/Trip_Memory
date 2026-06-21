import { useState, type KeyboardEvent } from 'react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

/** 태그 문자열 정리: 앞의 # 제거, 공백 정리 */
function normalize(raw: string): string {
  return raw.trim().replace(/^#+/, '').trim();
}

export default function TagInput({ tags, onChange }: Props) {
  const [draft, setDraft] = useState('');

  function addTag(raw: string) {
    const tag = normalize(raw);
    if (!tag) return;
    // 대소문자 무시 중복 방지
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...tags, tag]);
    setDraft('');
  }

  function remove(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      remove(tags.length - 1);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-sky-400">
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700"
        >
          #{tag}
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`${tag} 태그 삭제`}
            className="text-sky-400 hover:text-sky-700"
          >
            ✕
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={tags.length === 0 ? '태그 입력 후 Enter (예: 맛집, 미술관)' : '추가'}
        className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  );
}
