import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, ArrowUpDown, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranscriptStore, useUIStore } from '../store';
import { fetchTranscripts, deleteTranscript } from '../lib/api';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const STATUS_OPTIONS = ['', 'DONE', 'PROCESSING', 'PENDING', 'ERROR'];

export default function History() {
  const navigate = useNavigate();
  const { transcripts, isLoading, pagination, setTranscripts, setLoading, removeTranscript } = useTranscriptStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  async function load(params = {}) {
    setLoading(true);
    try {
      const res = await fetchTranscripts({ search, status, page, ...params });
      setTranscripts(res.data, res.pagination);
    } catch {
      // graceful empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, status, page]);

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sorted = [...transcripts].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
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

  const statusBadge = { DONE: 'badge-success', PROCESSING: 'badge-warning', PENDING: 'badge-muted', ERROR: 'badge-error' };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>History</h1>
          <p style={{ marginTop: 4, fontSize: '0.9rem' }}>All your transcripts in one place</p>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="flex gap-3 items-center" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="input-field-icon" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} />
            <input
              className="input-field"
              placeholder="Search by title or content…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field"
            style={{ width: 160 }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div className="empty-state" style={{ minHeight: 200 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 240 }}>
              <div className="empty-icon"><FileText size={28} /></div>
              <h3>No transcripts found</h3>
              <p>{search || status ? 'Try adjusting your filters' : 'Upload audio to get started'}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('title')}>
                      <span className="flex items-center gap-1">Title <SortIcon field="title" /></span>
                    </th>
                    <th>Status</th>
                    <th onClick={() => toggleSort('duration')}>
                      <span className="flex items-center gap-1">Duration <SortIcon field="duration" /></span>
                    </th>
                    <th>Language</th>
                    <th onClick={() => toggleSort('createdAt')}>
                      <span className="flex items-center gap-1">Created <SortIcon field="createdAt" /></span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/transcripts/${t.id}`)}>
                      <td className="history-table-name">
                        <div className="history-table-name-text" title={t.title}>{t.title}</div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge[t.status] || 'badge-muted'}`}>
                          {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td>{formatDuration(t.duration)}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{t.language || '—'}</td>
                      <td>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
                      <td>
                        <button
                          className="btn btn-icon btn-ghost"
                          onClick={(e) => handleDelete(e, t.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} color="var(--error)" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: 16, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <span>{pagination.total} total</span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span style={{ padding: '6px 12px' }}>Page {page} of {pagination.pages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
