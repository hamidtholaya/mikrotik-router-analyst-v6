'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  GripVertical, 
  Activity, 
  Table as TableIcon, 
  BarChart3, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export default function ReorderModal({ isOpen, items: initialItems, onClose, onSave }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialItems) {
      setItems([...initialItems]);
    }
  }, [initialItems, isOpen]);

  if (!isOpen) return null;

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleMoveDown = (index) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orderedIds = items.map(item => item.id);
      await onSave(orderedIds);
      onClose();
    } catch (err) {
      console.error('Reorder save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        borderRadius: 'var(--radius-xl)',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        border: '1px solid var(--border-active)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <ArrowUpDown style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>Reorder Dashboard Items</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Arrange the display order of your widgets</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* List Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
          {items.map((item, idx) => (
            <div 
              key={item.id} 
              className="glass-card" 
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GripVertical style={{ width: '18px', height: '18px', color: 'var(--text-dim)', cursor: 'grab' }} />
                
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--accent-cyan)'
                }}>
                  {idx + 1}
                </div>

                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                      {item.type === 'stat_card' ? 'Stat Card' : item.type === 'table' ? 'Table' : `${item.chartType || 'Bar'} Chart`}
                    </span>
                    <span>&bull;</span>
                    <span>{item.size === 'full' ? 'Full Width' : item.size === 'third' ? '1/3 Width' : 'Half Width'}</span>
                  </div>
                </div>
              </div>

              {/* Move Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: idx === 0 ? 0.3 : 1 }}
                  title="Move Up"
                >
                  <ArrowUp style={{ width: '14px', height: '14px' }} />
                </button>

                <button
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === items.length - 1}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: idx === items.length - 1 ? 0.3 : 1 }}
                  title="Move Down"
                >
                  <ArrowDown style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              No items to reorder.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button onClick={onClose} disabled={saving} className="btn btn-secondary">
            Cancel
          </button>

          <button onClick={handleSave} disabled={saving || items.length === 0} className="btn btn-primary">
            {saving ? (
              <>
                <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
                Saving Order...
              </>
            ) : (
              <>
                <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                Save Order
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
