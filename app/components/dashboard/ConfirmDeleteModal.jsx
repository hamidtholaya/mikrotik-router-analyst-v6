'use client';

import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, itemName, onClose, onConfirm, deleting }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1100,
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
            Remove Item from Dashboard?
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>"{itemName}"</strong>? This will remove the widget configuration from <code style={{ color: 'var(--accent-cyan)' }}>configs.json</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={onClose}
            disabled={deleting}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={deleting}
            className="btn btn-danger"
            style={{ flex: 1 }}
          >
            {deleting ? (
              <>
                <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 style={{ width: '15px', height: '15px' }} />
                Confirm Delete
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
