import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Timeline from './pages/Timeline';
import CalendarView from './pages/CalendarView';
import MapView from './pages/MapView';
import EntryEditor from './pages/EntryEditor';
import EntryDetail from './pages/EntryDetail';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="min-h-full">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/entry/new" element={<EntryEditor />} />
          <Route path="/entry/:id" element={<EntryDetail />} />
          <Route path="/entry/:id/edit" element={<EntryEditor />} />
          <Route path="*" element={<Timeline />} />
        </Routes>
      </main>
    </div>
  );
}
