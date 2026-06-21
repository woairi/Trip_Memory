import { NavLink, useNavigate } from 'react-router-dom';

const linkBase =
  'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors';

function navClass({ isActive }: { isActive: boolean }) {
  return `${linkBase} ${isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`;
}

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <>
      {/* 상단 헤더 (PC/모바일 공통) */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg font-bold text-slate-800"
          >
            <span aria-hidden>🧳</span>
            <span>유럽 여행 기록</span>
          </button>
          <button
            onClick={() => navigate('/entry/new')}
            className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            + 기록
          </button>
        </div>
      </header>

      {/* 하단 탭 (모바일 우선) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          <NavLink to="/" end className={navClass}>
            <span aria-hidden className="text-base">📜</span>
            타임라인
          </NavLink>
          <NavLink to="/calendar" className={navClass}>
            <span aria-hidden className="text-base">🗓️</span>
            달력
          </NavLink>
          <NavLink to="/entry/new" className={navClass}>
            <span aria-hidden className="text-base">✏️</span>
            새 기록
          </NavLink>
        </div>
      </nav>
    </>
  );
}
