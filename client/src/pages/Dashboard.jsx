import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Upload, Clock, FileText, TrendingUp, ChevronRight, Trash2, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranscriptStore, useUIStore } from '../store';
import { fetchTranscripts, deleteTranscript } from '../lib/api';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function StatusBadge({ status }) {
  const map = {
    DONE: ['badge-success', 'Done'],
    PROCESSING: ['badge-warning', 'Processing'],
    PENDING: ['badge-muted', 'Pending'],
    ERROR: ['badge-error', 'Error'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { transcripts, isLoading, setTranscripts, setLoading, removeTranscript } = useTranscriptStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchTranscripts({ limit: 50 });
        setTranscripts(res.data, res.pagination);
      } catch {
        // Backend may not be running; show empty state gracefully
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = transcripts.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.content || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: transcripts.length,
    done: transcripts.filter((t) => t.status === 'DONE').length,
    totalDuration: transcripts.reduce((acc, t) => acc + (t.duration || 0), 0),
    today: transcripts.filter((t) => new Date(t.createdAt).toDateString() === new Date().toDateString()).length,
  };

  async function handleDelete(e, id) {
    e.stopPropagation();
    try {
      await deleteTranscript(id);
      removeTranscript(id);
      addToast({ type: 'success', message: 'Transcript deleted' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ marginTop: 4, fontSize: '0.9rem' }}>Your transcription workspace</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('/upload?tab=record')}>
            <Mic size={15} /> New Recording
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <Upload size={15} /> Upload File
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Transcripts</div>
            <div className="stat-delta"><TrendingUp size={12} /> All time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.done}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatDuration(stats.totalDuration)}</div>
            <div className="stat-label">Total Audio</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.today}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <div className="input-field-icon" style={{ flex: 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="input-field"
              placeholder="Search transcripts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="empty-state">
            <div className="spinner spinner-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={28} /></div>
            <h3>No transcripts yet</h3>
            <p>Upload an audio file or record live to get started.</p>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              <Upload size={15} /> Get Started
            </button>
          </div>
        ) : (
          <div className="transcript-grid">
            {filtered.map((t) => (
              <div key={t.id} className="card card-clickable transcript-card" onClick={() => navigate(`/transcripts/${t.id}`)}>
                <div className="transcript-card-header">
                  <div className="transcript-card-title">{t.title}</div>
                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={(e) => handleDelete(e, t.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} color="var(--error)" />
                  </button>
                </div>

                <div className="transcript-card-preview">
                  {t.content ? t.content.slice(0, 140) + (t.content.length > 140 ? '…' : '') : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Processing…</span>}
                </div>

                <div className="transcript-card-meta">
                  <StatusBadge status={t.status} />
                  <div className="flex items-center gap-2">
                    {t.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDuration(t.duration)}
                      </span>
                    )}
                    <span>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</span>
                    <ChevronRight size={14} color="var(--accent)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
