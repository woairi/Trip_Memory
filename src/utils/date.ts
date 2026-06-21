import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/** 오늘 날짜를 'YYYY-MM-DD' 로 반환 (로컬 타임존 기준) */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** 'YYYY-MM-DD' → '2026년 6월 21일 (일)' */
export function formatKoreanDate(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy년 M월 d일 (EEE)', { locale: ko });
  } catch {
    return iso;
  }
}

/** 'YYYY-MM-DD' → '6월 21일' */
export function formatShortDate(iso: string): string {
  try {
    return format(parseISO(iso), 'M월 d일', { locale: ko });
  } catch {
    return iso;
  }
}
