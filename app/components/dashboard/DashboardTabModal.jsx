'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  Wifi, 
  Activity, 
  Database, 
  ShieldCheck, 
  HardDrive, 
  BarChart3, 
  PieChart, 
  Radio, 
  Zap, 
  Server,
  Sparkles,
  Loader2,
  Trash2
} from 'lucide-react';
import { TAB_ICON_MAP } from './DashboardTabs';

const AVAILABLE_TAB_ICONS = [
  { name: 'LayoutDashboard', label: 'Overview', icon: LayoutDashboard },
  { name: 'Users', label: 'Users', icon: Users },
  { name: 'Wifi', label: 'Hotspot', icon: Wifi },
  { name: 'Activity', label: 'Traffic', icon: Activity },
  { name: 'Database', label: 'Database', icon: Database },
  { name: 'BarChart3', label: 'Analytics', icon: BarChart3 },
  { name: 'Radio', label: 'Wireless', icon: Radio },
  { name: 'ShieldCheck', label: 'Security', icon: ShieldCheck },
  { name: 'HardDrive', label: 'Storage', icon: HardDrive },
  { name: 'Server', label: 'System', icon: Server },
  { name: 'Zap', label: 'Performance', icon: Zap },
  { name: 'PieChart', label: 'Distribution', icon: PieChart }
];

export default function DashboardTabModal({
  isOpen,
  mode = 'create', // 'create' or 'rename'
  initialData = null,
  canDelete = false,
  onClose,
  onSave,
  onDeleteClick
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('LayoutDashboard');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setIcon(initialData.icon || 'LayoutDashboard');
    } else {
      setName('');
      setIcon('LayoutDashboard');
    }
  }, [initialData, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        icon
      });
      onClose();
    } catch (err) {
      console.error('Save dashboard tab error:', err);
    } finally {
      setSaving(false);
    }
  };

  const isRename = mode === 'rename';

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
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        borderRadius: 'var(--radius-xl)',
        maxWidth: '460px',
        width: '100%',
        border: '1px solid var(--border-active)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
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
              <LayoutDashboard style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {isRename ? 'Rename Dashboard Tab' : 'Create New Dashboard'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Organize your widgets into custom views
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Dashboard Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
              Dashboard Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hotspot Sessions, User Analytics, etc."
              required
              autoFocus
              style={{ width: '100%' }}
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
              Tab Icon
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              {AVAILABLE_TAB_ICONS.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = icon === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                      background: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      gap: '4px'
                    }}
                    title={item.label}
                  >
                    <ItemIcon style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '0.65rem' }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isRename && canDelete ? 'space-between' : 'flex-end',
            gap: '12px',
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
            {isRename && canDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onDeleteClick) onDeleteClick(initialData);
                }}
                disabled={saving}
                className="btn"
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.82rem',
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Delete this dashboard tab with confirmation"
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                Delete Dashboard
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  isRename ? 'Save Changes' : 'Create Dashboard'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
