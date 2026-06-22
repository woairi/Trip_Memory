import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  countEntries,
  exportAll,
  importAll,
  type BackupFile,
} from '../db/entries';
import { downloadFile } from '../utils/backup';
import { todayISO } from '../utils/date';

export default function Settings() {
  const navigate = useNavigate();
  const count = useLiveQuery(() => countEntries(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [replace, setReplace] = useState(false);

  async function handleExport() {
    setBusy('export');
    try {
      const data = await exportAll();
      downloadFile(
        `trip-memory-backup-${todayISO()}.json`,
        JSON.stringify(data),
        'application/json',
      );
    } catch (e) {
      alert('내보내기에 실패했어요: ' + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleImportFile(file: File) {
    if (
      replace &&
      !confirm('기존 기록을 모두 삭제하고 백업으로 덮어쓸까요? 되돌릴 수 없습니다.')
    ) {
      return;
    }
    setBusy('import');
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupFile;
      const n = await importAll(data, replace);
      alert(`${n}개의 기록을 가져왔어요.`);
      navigate('/');
    } catch (e) {
      alert('가져오기에 실패했어요: ' + (e as Error).message);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">설정 · 백업</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">
          현재 저장된 기록{' '}
          <span className="font-semibold text-slate-800">{count ?? '…'}개</span>
        </p>
      </section>

      {/* 내보내기 */}
      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">백업 내보내기</h2>
        <p className="text-sm text-slate-500">
          모든 기록과 사진을 하나의 JSON 파일로 저장합니다. 기기 변경·캐시 삭제에
          대비해 정기적으로 백업해 두세요.
        </p>
        <button
          onClick={handleExport}
          disabled={busy !== null}
          className="mt-1 w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {busy === 'export' ? '내보내는 중…' : '⬇️ 백업 파일 내보내기 (.json)'}
        </button>
      </section>

      {/* 가져오기 */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">백업 가져오기</h2>
        <p className="text-sm text-slate-500">
          내보낸 백업 파일(.json)에서 기록을 복원합니다.
        </p>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          가져오기 전 기존 기록 모두 삭제 (덮어쓰기)
        </label>
        {!replace ? (
          <p className="text-xs text-slate-400">
            체크하지 않으면 기존 기록에 <b>이어서 추가</b>됩니다.
          </p>
        ) : null}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className="w-full rounded-xl border border-sky-200 py-3 font-semibold text-sky-700 transition-colors hover:bg-sky-50 disabled:opacity-60"
        >
          {busy === 'import' ? '가져오는 중…' : '⬆️ 백업 파일 선택해서 가져오기'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
          }}
        />
      </section>

      <p className="px-1 text-xs text-slate-400">
        모든 데이터는 이 브라우저 안에만 저장됩니다. 백업 파일에는 사진이 포함되어
        용량이 클 수 있어요.
      </p>
    </div>
  );
}
