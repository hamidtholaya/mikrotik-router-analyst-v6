'use client';

import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function ConfirmDeleteTabModal({ 
  isOpen, 
  dashboard, 
  onClose, 
  onConfirm, 
  deleting 
}) {
  if (!isOpen || !dashboard) return null;

  const widgetCount = dashboard.items ? dashboard.items.length : 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        borderRadius: 'var(--radius-lg)',
        maxWidth: '440px',
        width: '100%',
        padding: '24px',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-rose)'
        }}>
          <AlertTriangle style={{ width: '26px', height: '26px' }} />
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
            Delete Dashboard Tab?
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>"{dashboard.name}"</strong>?
            {widgetCount > 0 && (
              <span style={{ display: 'block', marginTop: '6px', color: 'var(--accent-rose)' }}>
                This tab contains {widgetCount} {widgetCount === 1 ? 'widget' : 'widgets'} which will also be removed.
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => onConfirm(dashboard.id)}
            disabled={deleting}
            className="btn"
            style={{
              flex: 1,
              background: 'var(--accent-rose)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {deleting ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Delete Tab
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
