import { create } from 'zustand';

// ─── Transcript Store ────────────────────────────────────────────────
export const useTranscriptStore = create((set, get) => ({
  transcripts: [],
  currentTranscript: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 1 },
  isLoading: false,
  isLoadingOne: false,
  error: null,

  setTranscripts: (transcripts, pagination) =>
    set({ transcripts, pagination: pagination ?? get().pagination }),

  setCurrentTranscript: (transcript) => set({ currentTranscript: transcript }),

  updateCurrentContent: (content) =>
    set((s) => ({
      currentTranscript: s.currentTranscript ? { ...s.currentTranscript, content } : null,
    })),

  updateCurrentTitle: (title) =>
    set((s) => ({
      currentTranscript: s.currentTranscript ? { ...s.currentTranscript, title } : null,
    })),

  addOrUpdateTranscript: (transcript) =>
    set((s) => {
      const exists = s.transcripts.find((t) => t.id === transcript.id);
      if (exists) {
        return { transcripts: s.transcripts.map((t) => (t.id === transcript.id ? transcript : t)) };
      }
      return { transcripts: [transcript, ...s.transcripts] };
    }),

  removeTranscript: (id) =>
    set((s) => ({ transcripts: s.transcripts.filter((t) => t.id !== id) })),

  setLoading: (isLoading) => set({ isLoading }),
  setLoadingOne: (isLoadingOne) => set({ isLoadingOne }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

// ─── Upload / Recording Store ────────────────────────────────────────
export const useUploadStore = create((set) => ({
  uploadState: 'idle', // idle | uploading | processing | done | error
  uploadPct: 0,
  processingPct: 0,
  processingStage: '',
  pendingTranscriptId: null,
  errorMessage: null,

  startUpload: () => set({ uploadState: 'uploading', uploadPct: 0, errorMessage: null }),
  setUploadPct: (pct) => set({ uploadPct: pct }),
  startProcessing: (id) => set({ uploadState: 'processing', pendingTranscriptId: id, processingPct: 10 }),
  setProcessingProgress: (pct, stage) => set({ processingPct: pct, processingStage: stage }),
  setDone: () => set({ uploadState: 'done', processingPct: 100 }),
  setUploadError: (msg) => set({ uploadState: 'error', errorMessage: msg }),
  reset: () => set({ uploadState: 'idle', uploadPct: 0, processingPct: 0, pendingTranscriptId: null, errorMessage: null }),
}));

// ─── Recording Store ─────────────────────────────────────────────────
export const useRecordingStore = create((set) => ({
  isRecording: false,
  recordingTime: 0, // seconds
  audioBlob: null,
  mediaRecorder: null,

  setRecording: (isRecording) => set({ isRecording }),
  setRecordingTime: (recordingTime) => set({ recordingTime }),
  setAudioBlob: (audioBlob) => set({ audioBlob }),
  setMediaRecorder: (mediaRecorder) => set({ mediaRecorder }),
  reset: () => set({ isRecording: false, recordingTime: 0, audioBlob: null, mediaRecorder: null }),
}));

// ─── UI Store ────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  toasts: [],
  searchQuery: '',

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast = { id, ...toast };
    set((s) => ({ toasts: [...s.toasts, newToast] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
