import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '../store';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
          {toast.type === 'success' && <CheckCircle size={16} color="var(--success)" />}
          {toast.type === 'error' && <AlertCircle size={16} color="var(--error)" />}
          {toast.type === 'info' && <Info size={16} color="var(--accent)" />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button className="btn btn-icon btn-ghost" style={{ padding: 4 }} onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
