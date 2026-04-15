import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, Mic, Square, CheckCircle, AlertCircle, FileAudio } from 'lucide-react';
import { useUploadStore, useRecordingStore, useUIStore } from '../store';
import { uploadAndTranscribe } from '../lib/api';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function ProgressSteps({ stage, pct }) {
  const stages = [
    { key: 'uploading', label: 'Uploading' },
    { key: 'processing', label: 'Processing' },
    { key: 'transcribing', label: 'Transcribing' },
    { key: 'saving', label: 'Saving' },
    { key: 'done', label: 'Done' },
  ];
  return (
    <div style={{ padding: '24px 0' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{stage || 'Preparing…'}</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UploadRecord() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') === 'record' ? 'record' : 'upload';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const fileInputRef = useRef(null);

  // Stores
  const { uploadState, uploadPct, processingPct, processingStage, pendingTranscriptId, errorMessage, startUpload, setUploadPct, startProcessing, reset } = useUploadStore();
  const { isRecording, recordingTime, audioBlob, mediaRecorder, setRecording, setRecordingTime, setAudioBlob, setMediaRecorder } = useRecordingStore();
  const { addToast } = useUIStore();

  // Timer for recording
  const timerRef = useRef(null);
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(recordingTime + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, recordingTime]);

  // Drag & Drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  function handleFileSelect(file) {
    const allowed = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'];
    if (!allowed.includes(file.type)) {
      addToast({ type: 'error', message: 'Unsupported format. Use MP3, M4A, WAV, or WebM.' });
      return;
    }
    setSelectedFile(file);
    setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    reset();
  }

  async function handleUpload() {
    if (!selectedFile) return;
    startUpload();
    try {
      const res = await uploadAndTranscribe(selectedFile, customTitle, (evt) => {
        if (evt.total) setUploadPct(Math.round((evt.loaded / evt.total) * 100));
      });
      startProcessing(res.id);
      addToast({ type: 'info', message: 'Transcription started — we\'ll notify you when done' });
    } catch (err) {
      useUploadStore.getState().setUploadError(err.message);
      addToast({ type: 'error', message: err.message });
    }
  }

  // Recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
      setRecordingTime(0);
    } catch {
      addToast({ type: 'error', message: 'Microphone access denied. Please check your browser permissions.' });
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);
  }

  async function uploadRecording() {
    if (!audioBlob) return;
    const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
    const title = customTitle || `Recording ${new Date().toLocaleString()}`;
    startUpload();
    try {
      const res = await uploadAndTranscribe(file, title, (evt) => {
        if (evt.total) setUploadPct(Math.round((evt.loaded / evt.total) * 100));
      });
      startProcessing(res.id);
      setAudioBlob(null);
      setRecordingTime(0);
      addToast({ type: 'info', message: 'Recording submitted for transcription' });
    } catch (err) {
      useUploadStore.getState().setUploadError(err.message);
      addToast({ type: 'error', message: err.message });
    }
  }

  const isIdle = uploadState === 'idle';
  const isUploading = uploadState === 'uploading';
  const isProcessing = uploadState === 'processing';
  const isDone = uploadState === 'done';
  const isError = uploadState === 'error';

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Upload &amp; Record</h1>
          <p style={{ marginTop: 4, fontSize: '0.9rem' }}>Add audio to transcribe</p>
        </div>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div className="flex gap-2" style={{ marginBottom: 28 }}>
          {['upload', 'record'].map((tab) => (
            <button
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab(tab); reset(); setSelectedFile(null); setAudioBlob(null); }}
            >
              {tab === 'upload' ? <><Upload size={14} /> Upload File</> : <><Mic size={14} /> Live Record</>}
            </button>
          ))}
        </div>

        {activeTab === 'upload' && (
          <div style={{ maxWidth: 580 }}>
            {/* Drop Zone */}
            <div
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="upload-zone-icon">
                {selectedFile ? <FileAudio size={28} /> : <Upload size={28} />}
              </div>
              {selectedFile ? (
                <>
                  <h3 style={{ color: 'var(--text)' }}>{selectedFile.name}</h3>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <h3 style={{ color: 'var(--text)' }}>Drop your audio file here</h3>
                  <p>MP3, WAV, M4A, WebM — up to 100 MB</p>
                  <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Browse Files
                  </button>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="audio/*" hidden onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])} />
            </div>

            {selectedFile && isIdle && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  className="input-field"
                  placeholder="Transcript title (optional)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpload}>
                    Transcribe Now
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setSelectedFile(null); reset(); }}>
                    Clear
                  </button>
                </div>
              </div>
            )}

            {(isUploading || isProcessing) && (
              <ProgressSteps stage={isUploading ? 'uploading' : processingStage} pct={isUploading ? uploadPct : processingPct} />
            )}

            {isDone && (
              <div className="card" style={{ marginTop: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'var(--success)' }}>
                <CheckCircle size={20} color="var(--success)" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>Transcription complete!</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Your transcript is ready to view.</div>
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate(`/transcripts/${pendingTranscriptId}`)}>
                  View
                </button>
              </div>
            )}

            {isError && (
              <div className="card" style={{ marginTop: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'var(--error)' }}>
                <AlertCircle size={20} color="var(--error)" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>Something went wrong</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{errorMessage}</div>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={reset}>Retry</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'record' && (
          <div style={{ maxWidth: 480 }}>
            <div className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              {/* Timer */}
              <div className="recording-timer" style={{ color: isRecording ? 'var(--error)' : 'var(--text)' }}>
                {formatTime(recordingTime)}
              </div>

              {/* Record button */}
              <button
                className={`record-btn${isRecording ? ' recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Square size={22} color="var(--error)" /> : <div className="record-dot" />}
              </button>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {isRecording ? 'Recording… click to stop' : audioBlob ? 'Recording ready' : 'Click to start recording'}
              </p>

              {audioBlob && !isRecording && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%', borderRadius: 8 }} />
                  <input
                    className="input-field"
                    placeholder="Recording title (optional)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={uploadRecording} disabled={isUploading || isProcessing}>
                      {isUploading || isProcessing ? <><div className="spinner" /> Uploading…</> : 'Transcribe Recording'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setAudioBlob(null); setRecordingTime(0); reset(); }}>
                      Discard
                    </button>
                  </div>
                  {(isUploading || isProcessing) && <ProgressSteps stage={isUploading ? 'uploading' : processingStage} pct={isUploading ? uploadPct : processingPct} />}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              💡 Tip: For best results, record in a quiet environment close to your microphone.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
