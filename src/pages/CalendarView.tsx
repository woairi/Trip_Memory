import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Entry } from '../db/db';
import { listEntries } from '../db/entries';
import { formatKoreanDate } from '../utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarView() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const entries = useLiveQuery(() => listEntries(), []);

  // 날짜(YYYY-MM-DD) → 해당 날짜 기록 목록
  const byDate = new Map<string, Entry[]>();
  for (const e of entries ?? []) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  });

  const selectedEntries = byDate.get(selected) ?? [];

  return (
    <div className="space-y-5">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="이전 달"
        >
          ‹
        </button>
        <h1 className="text-lg font-bold text-slate-800">
          {format(month, 'yyyy년 M월', { locale: ko })}
        </h1>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      {/* 달력 그리드 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`py-1 ${i === 0 ? 'text-rose-400' : ''} ${i === 6 ? 'text-sky-400' : ''}`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const iso = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, month);
            const dayEntries = byDate.get(iso) ?? [];
            const isSelected = iso === selected;
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={[
                  'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors',
                  inMonth ? 'text-slate-700' : 'text-slate-300',
                  isSelected ? 'bg-sky-600 text-white' : 'hover:bg-slate-100',
                  isToday(day) && !isSelected ? 'ring-1 ring-sky-300' : '',
                ].join(' ')}
              >
                <span>{format(day, 'd')}</span>
                {dayEntries.length > 0 ? (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-sky-500'
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택한 날짜의 기록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">
            {formatKoreanDate(selected)}
          </h2>
          <Link
            to={`/entry/new?date=${selected}`}
            className="text-xs font-medium text-sky-600 hover:underline"
          >
            + 이 날 기록 추가
          </Link>
        </div>

        {selectedEntries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            이 날의 기록이 없어요.
          </p>
        ) : (
          selectedEntries.map((e) => (
            <button
              key={e.id}
              onClick={() => navigate(`/entry/${e.id}`)}
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:shadow-md"
            >
              <p className="font-semibold text-slate-800">{e.title || '제목 없음'}</p>
              {e.locationName ? (
                <p className="mt-0.5 text-xs text-sky-600">📍 {e.locationName}</p>
              ) : null}
              {e.body ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{e.body}</p>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
