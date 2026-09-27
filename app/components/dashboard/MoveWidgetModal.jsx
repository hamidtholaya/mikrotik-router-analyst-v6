'use client';

import { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  LayoutDashboard, 
  Check, 
  Loader2 
} from 'lucide-react';
import { TAB_ICON_MAP } from './DashboardTabs';

export default function MoveWidgetModal({
  isOpen,
  item,
  dashboards = [],
  currentDashboardId,
  onClose,
  onMove
}) {
  const [moving, setMoving] = useState(false);
  const [selectedDashboardId, setSelectedDashboardId] = useState('');

  if (!isOpen || !item) return null;

  const otherDashboards = dashboards.filter(d => d.id !== currentDashboardId);

  const handleConfirmMove = async () => {
    if (!selectedDashboardId) return;
    setMoving(true);
    try {
      await onMove(item, selectedDashboardId);
      onClose();
    } catch (err) {
      console.error('Move widget error:', err);
    } finally {
      setMoving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(8px)',
      zIndex: 2200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}
    onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-xl)',
          maxWidth: '440px',
          width: '100%',
          padding: '22px',
          border: '1px solid var(--border-active)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}>
              <ArrowRightLeft style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Move Widget
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Select target dashboard for "{item.name}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Dashboard Selection List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Target Dashboard:
          </label>

          {otherDashboards.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.86rem' }}>
              No other dashboards available. Create a new dashboard tab first.
            </div>
          ) : (
            otherDashboards.map(dash => {
              const isSelected = selectedDashboardId === dash.id;
              const DashIcon = TAB_ICON_MAP[dash.icon] || LayoutDashboard;

              return (
                <button
                  key={dash.id}
                  type="button"
                  onClick={() => setSelectedDashboardId(dash.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-cyan-glow)' : 'var(--bg-input)',
                    border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <DashIcon style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{dash.name}</span>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-dim)'
                    }}>
                      {dash.items ? dash.items.length : 0} items
                    </span>
                  </div>

                  {isSelected && <Check style={{ width: '18px', height: '18px', color: 'var(--accent-cyan)' }} />}
                </button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={moving}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmMove}
            disabled={moving || !selectedDashboardId}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {moving ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Moving...
              </>
            ) : (
              <>
                <ArrowRightLeft style={{ width: '15px', height: '15px' }} />
                Move Widget
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
