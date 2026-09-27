'use client';

import { useState } from 'react';
import { 
  Plus, 
  MoreVertical,
  Edit3, 
  Trash2, 
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
  Server
} from 'lucide-react';

export const TAB_ICON_MAP = {
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
  Server
};

export default function DashboardTabs({
  dashboards = [],
  activeDashboardId,
  onSelectDashboard,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal
}) {
  const [activeOptionsTab, setActiveOptionsTab] = useState(null);

  return (
    <>
      {/* Light & Dark Adaptive Segmented Tab Bar */}
      <div 
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          padding: '6px 8px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {dashboards.map((dash) => {
          const isActive = dash.id === activeDashboardId;
          const IconComponent = TAB_ICON_MAP[dash.icon] || LayoutDashboard;
          const itemCount = dash.items ? dash.items.length : 0;

          return (
            <div
              key={dash.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-md)',
                background: isActive 
                  ? 'var(--accent-cyan-glow)' 
                  : 'transparent',
                border: isActive 
                  ? '1px solid var(--border-active)' 
                  : '1px solid transparent',
                boxShadow: isActive ? '0 2px 8px var(--accent-cyan-glow)' : 'none',
                padding: isActive ? '4px 6px 4px 12px' : '6px 12px',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
            >
              {/* Clickable Tab Select Area */}
              <button
                onClick={() => onSelectDashboard(dash.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  padding: '3px 0',
                  whiteSpace: 'nowrap'
                }}
              >
                <IconComponent style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>{dash.name}</span>

                {/* Item count badge: High-contrast pill */}
                <span style={{
                  fontSize: '0.72rem',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                  color: isActive ? '#ffffff' : 'var(--text-dim)',
                  fontWeight: '700',
                  border: isActive ? 'none' : '1px solid var(--border-color)'
                }}>
                  {itemCount}
                </span>
              </button>

              {/* Three Dots Button: perfectly integrated inside active tab */}
              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveOptionsTab(dash);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-active)',
                    color: 'var(--accent-cyan)',
                    borderRadius: '6px',
                    width: '26px',
                    height: '26px',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Dashboard options"
                >
                  <MoreVertical style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Dashboard Button */}
        <button
          onClick={onOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.84rem',
            fontWeight: '500',
            background: 'transparent',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
          title="Create new dashboard tab"
        >
          <Plus style={{ width: '15px', height: '15px' }} />
          <span>New Tab</span>
        </button>
      </div>

      {/* High-Z-Index Action Sheet Modal for Tab Options (ADAPTIVE TO LIGHT & DARK) */}
      {activeOptionsTab && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setActiveOptionsTab(null)}
        >
          <div
            className="glass-panel"
            style={{
              borderRadius: 'var(--radius-xl)',
              maxWidth: '380px',
              width: '100%',
              padding: '22px',
              border: '1px solid var(--border-active)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--accent-cyan-glow)',
                  border: '1px solid var(--border-active)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)'
                }}>
                  {(() => {
                    const ModalIcon = TAB_ICON_MAP[activeOptionsTab.icon] || LayoutDashboard;
                    return <ModalIcon style={{ width: '18px', height: '18px' }} />;
                  })()}
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.98rem' }}>
                    {activeOptionsTab.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {activeOptionsTab.items ? activeOptionsTab.items.length : 0} active widgets
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveOptionsTab(null)}
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {/* Rename / Edit Tab Option */}
              <button
                onClick={() => {
                  const targetTab = activeOptionsTab;
                  setActiveOptionsTab(null);
                  onOpenEditModal(targetTab);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                  flexShrink: 0
                }}>
                  <Edit3 style={{ width: '16px', height: '16px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600' }}>Rename / Edit Tab</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>Change dashboard name and icon</div>
                </div>
              </button>

              {/* Delete Tab Option (with confirmation) */}
              {dashboards.length > 1 && (
                <button
                  onClick={() => {
                    const targetTab = activeOptionsTab;
                    setActiveOptionsTab(null);
                    onOpenDeleteModal(targetTab);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.06)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: 'var(--accent-rose)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-rose)',
                    flexShrink: 0
                  }}>
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '600' }}>Delete Tab</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--accent-rose)' }}>Permanently remove with confirmation</div>
                  </div>
                </button>
              )}
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setActiveOptionsTab(null)}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '0.86rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
