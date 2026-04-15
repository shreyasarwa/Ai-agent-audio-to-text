import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { useWebSocket } from './hooks/useWebSocket';
import Dashboard from './pages/Dashboard';
import UploadRecord from './pages/UploadRecord';
import TranscriptViewer from './pages/TranscriptViewer';
import History from './pages/History';

function AppInner() {
  useWebSocket();

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadRecord />} />
            <Route path="/transcripts/:id" element={<TranscriptViewer />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default function App() {
  return <AppInner />;
}
