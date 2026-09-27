'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Sparkles, 
  Loader2,
  ArrowUpDown,
  Database,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import WidgetCard from '../components/dashboard/WidgetCard';
import AddWidgetModal from '../components/dashboard/AddWidgetModal';
import ConfirmDeleteModal from '../components/dashboard/ConfirmDeleteModal';
import ReorderModal from '../components/dashboard/ReorderModal';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import DashboardTabModal from '../components/dashboard/DashboardTabModal';
import ConfirmDeleteTabModal from '../components/dashboard/ConfirmDeleteTabModal';
import { apiFetch } from '../lib/apiClient';

const ACTIVE_DASHBOARD_STORAGE_KEY = 'mikrotik_active_dashboard_id';

function formatRelativeTime(dateStr) {
  if (!dateStr) return { relative: 'Never', exact: 'No sync recorded' };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { relative: 'Unknown', exact: dateStr };

  const exact = date.toLocaleString();
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 10) return { relative: 'Just now', exact };
  if (diffSec < 60) return { relative: `${diffSec}s ago`, exact };
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return { relative: `${diffMin}m ago`, exact };
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return { relative: `${diffHours}h ago`, exact };
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { relative: 'Yesterday', exact };
  if (diffDays < 30) return { relative: `${diffDays}d ago`, exact };
  return { relative: date.toLocaleDateString(), exact };
}

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboardId, setActiveDashboardId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Widget Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dashboard Tab Modals
  const [tabModalMode, setTabModalMode] = useState('create'); // 'create' | 'rename'
  const [isTabModalOpen, setIsTabModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState(null);
  const [deletingTab, setDeletingTab] = useState(null);
  const [isDeletingTab, setIsDeletingTab] = useState(false);

  // Database Sync Status
  const [activeDb, setActiveDb] = useState(null);
  const [syncingDb, setSyncingDb] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [syncErr, setSyncErr] = useState(null);
  const [queryRefreshKey, setQueryRefreshKey] = useState(Date.now());
  const [, setTimeTick] = useState(0);

  // Auto-refresh relative time every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardConfig();
    checkActiveDb();
  }, []);

  const checkActiveDb = async () => {
    try {
      const res = await apiFetch('/api/userman/sync');
      const data = await res.json();
      if (data.activeDb) {
        setActiveDb(data.activeDb);
      }
    } catch (e) {
      console.error('Failed to check active db:', e);
    }
  };

  const handleSyncDatabase = async () => {
    setSyncingDb(true);
    setSyncMsg(null);
    setSyncErr(null);
    try {
      const res = await apiFetch('/api/userman/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMsg('Database downloaded successfully from router! Refreshing active queries...');
        if (data.activeDb) setActiveDb(data.activeDb);
        // Force-refresh active queries with the freshly synced database
        setQueryRefreshKey(Date.now());
        setTimeout(() => setSyncMsg(null), 4000);
      } else {
        setSyncErr(data.error || 'Failed to download database from router.');
      }
    } catch (err) {
      setSyncErr('Network error: ' + (err.message || err.toString()));
    } finally {
      setSyncingDb(false);
    }
  };

  const fetchDashboardConfig = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/dashboard/config');
      const data = await res.json();
      if (data.success && Array.isArray(data.dashboards)) {
        setDashboards(data.dashboards);

        // Remember active dashboard from localStorage or fallback to server activeId
        const savedId = localStorage.getItem(ACTIVE_DASHBOARD_STORAGE_KEY);
        const match = data.dashboards.find(d => d.id === savedId);

        if (match) {
          setActiveDashboardId(match.id);
        } else if (data.activeDashboardId && data.dashboards.some(d => d.id === data.activeDashboardId)) {
          setActiveDashboardId(data.activeDashboardId);
        } else if (data.dashboards.length > 0) {
          setActiveDashboardId(data.dashboards[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDashboard = (id) => {
    setActiveDashboardId(id);
    localStorage.setItem(ACTIVE_DASHBOARD_STORAGE_KEY, id);
  };

  // Find active dashboard object
  const activeDashboard = dashboards.find(d => d.id === activeDashboardId) || dashboards[0] || { items: [] };
  const currentItems = activeDashboard.items || [];

  // Tab Handlers: Create, Rename, Delete
  const handleOpenCreateTabModal = () => {
    setTabModalMode('create');
    setEditingTab(null);
    setIsTabModalOpen(true);
  };

  const handleOpenEditTabModal = (tab) => {
    setTabModalMode('rename');
    setEditingTab(tab);
    setIsTabModalOpen(true);
  };

  const handleSaveTab = async ({ id, name, icon }) => {
    try {
      if (tabModalMode === 'create') {
        const res = await apiFetch('/api/dashboard/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create_dashboard', name, icon })
        });
        const data = await res.json();
        if (data.success && data.dashboards) {
          setDashboards(data.dashboards);
          if (data.activeDashboardId) {
            handleSelectDashboard(data.activeDashboardId);
          }
        }
      } else {
        const res = await apiFetch('/api/dashboard/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rename_dashboard', dashboardId: id, name, icon })
        });
        const data = await res.json();
        if (data.success && data.dashboards) {
          setDashboards(data.dashboards);
        }
      }
    } catch (err) {
      console.error('Error saving dashboard tab:', err);
    }
  };

  const handleConfirmDeleteTab = async (dashboardId) => {
    setIsDeletingTab(true);
    try {
      const res = await apiFetch('/api/dashboard/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_dashboard', dashboardId })
      });
      const data = await res.json();
      if (data.success && data.dashboards) {
        setDashboards(data.dashboards);
        if (activeDashboardId === dashboardId) {
          const nextActive = data.activeDashboardId || (data.dashboards[0] ? data.dashboards[0].id : null);
          if (nextActive) {
            handleSelectDashboard(nextActive);
          }
        }
      }
    } catch (err) {
      console.error('Error deleting dashboard tab:', err);
    } finally {
      setIsDeletingTab(false);
      setDeletingTab(null);
    }
  };

  // Widget Item Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (itemToEdit) => {
    setEditingItem(itemToEdit);
    setIsModalOpen(true);
  };

  const handleSaveWidget = async (widgetData) => {
    try {
      const isEditing = !!(widgetData && widgetData.id);
      const url = '/api/dashboard/config';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...widgetData,
          dashboardId: activeDashboard.id
        })
      });
      const data = await res.json();

      if (data.success && data.dashboards) {
        setDashboards(data.dashboards);
      }
    } catch (err) {
      console.error('Save widget error:', err);
    }
  };

  const handleSaveOrder = async (orderedIds) => {
    try {
      const res = await apiFetch('/api/dashboard/config/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds, dashboardId: activeDashboard.id })
      });
      const data = await res.json();

      if (data.success && data.dashboards) {
        setDashboards(data.dashboards);
      }
    } catch (err) {
      console.error('Reorder save error:', err);
    }
  };

  const handleMoveLeft = async (id) => {
    const idx = currentItems.findIndex(item => item.id === id);
    if (idx <= 0) return;

    const newItems = [...currentItems];
    const temp = newItems[idx - 1];
    newItems[idx - 1] = newItems[idx];
    newItems[idx] = temp;

    // Optimistically update
    setDashboards(prev => prev.map(d => d.id === activeDashboard.id ? { ...d, items: newItems } : d));
    await handleSaveOrder(newItems.map(item => item.id));
  };

  const handleMoveRight = async (id) => {
    const idx = currentItems.findIndex(item => item.id === id);
    if (idx === -1 || idx >= currentItems.length - 1) return;

    const newItems = [...currentItems];
    const temp = newItems[idx + 1];
    newItems[idx + 1] = newItems[idx];
    newItems[idx] = temp;

    // Optimistically update
    setDashboards(prev => prev.map(d => d.id === activeDashboard.id ? { ...d, items: newItems } : d));
    await handleSaveOrder(newItems.map(item => item.id));
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    try {
      const res = await apiFetch(`/api/dashboard/config?id=${deletingItem.id}&dashboardId=${activeDashboard.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success && data.dashboards) {
        setDashboards(data.dashboards);
      }
    } catch (err) {
      console.error('Delete widget error:', err);
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const syncTime = formatRelativeTime(activeDb?.lastModified);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Dashboard Top Control & Sync Bar */}
      <div className="glass-panel" style={{ 
        borderRadius: 'var(--radius-lg)', 
        padding: '18px 22px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutDashboard style={{ color: 'var(--accent-cyan)', width: '24px', height: '24px' }} />
              Router Dashboard
            </h1>

            {/* Latest Database Sync Status Badge */}
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: activeDb?.exists ? 'var(--accent-emerald-glow)' : 'rgba(244, 63, 94, 0.12)',
                border: activeDb?.exists ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-rose)',
                fontSize: '0.8rem',
                color: activeDb?.exists ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                fontWeight: '600'
              }}
              title={activeDb?.exists ? `Exact Sync Time: ${syncTime.exact}` : 'Database has not been downloaded from router'}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: activeDb?.exists ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                boxShadow: activeDb?.exists ? '0 0 8px var(--accent-emerald)' : '0 0 8px var(--accent-rose)',
                display: 'inline-block'
              }} />
              <span>
                {activeDb?.exists ? `Synced: ${syncTime.relative}` : 'No Database Synced'}
              </span>
              {activeDb?.sizeFormatted && (
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  • {activeDb.sizeFormatted}
                </span>
              )}

              {/* Inline Quick Sync Button */}
              <button
                onClick={handleSyncDatabase}
                disabled={syncingDb}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: syncingDb ? 'not-allowed' : 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px'
                }}
                title="Sync database now directly from router"
              >
                <RefreshCw style={{ 
                  width: '13px', 
                  height: '13px', 
                  animation: syncingDb ? 'spin 1s linear infinite' : 'none' 
                }} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Queries execute against local <code style={{ color: 'var(--accent-cyan)' }}>userman_active.db</code>. Inactive tabs consume 0 background resources.
          </p>
        </div>

        {/* Top Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {currentItems.length > 1 && (
            <button
              onClick={() => setIsReorderModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              title="Reorder widgets on this dashboard"
            >
              <ArrowUpDown style={{ width: '15px', height: '15px', color: 'var(--accent-cyan)' }} />
              Reorder
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Plus style={{ width: '17px', height: '17px' }} />
            Add Widget
          </button>
        </div>
      </div>

      {/* Database Status & Quick Sync Notification Banner */}
      {syncMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 18px',
          color: '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--accent-emerald)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.88rem' }}>{syncMsg}</div>
        </div>
      )}

      {syncErr && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 18px',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--accent-rose)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.86rem' }}>{syncErr}</div>
          </div>
          <button
            onClick={handleSyncDatabase}
            disabled={syncingDb}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            Retry Sync
          </button>
        </div>
      )}

      {activeDb && !activeDb.exists && !syncMsg && (
        <div className="glass-panel" style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(6, 182, 212, 0.08))',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
            <AlertCircle style={{ color: 'var(--accent-rose)', width: '22px', height: '22px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.92rem' }}>
                User Manager Database not synced yet
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Download <code style={{ color: 'var(--accent-cyan)' }}>user-manager/sqldb</code> directly from your router into your phone to enable live SQL widgets.
              </div>
            </div>
          </div>
          <button
            onClick={handleSyncDatabase}
            disabled={syncingDb}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {syncingDb ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Downloading sqldb...
              </>
            ) : (
              <>
                <Download style={{ width: '16px', height: '16px' }} />
                Download Database Now
              </>
            )}
          </button>
        </div>
      )}

      {/* Multi-Dashboard Pill Tabs Bar */}
      <DashboardTabs
        dashboards={dashboards}
        activeDashboardId={activeDashboard.id}
        onSelectDashboard={handleSelectDashboard}
        onOpenCreateModal={handleOpenCreateTabModal}
        onOpenEditModal={handleOpenEditTabModal}
        onOpenDeleteModal={(tab) => setDeletingTab(tab)}
      />

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <Loader2 style={{ width: '28px', height: '28px', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto', color: 'var(--accent-cyan)' }} />
          Loading dashboard...
        </div>
      )}

      {/* Dashboard Items Grid (ONLY ACTIVE DASHBOARD MOUNTED - ZERO QUERIES FOR INACTIVE) */}
      {!loading && currentItems.length > 0 && (
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
          {currentItems.map((item, idx) => (
            <WidgetCard 
              key={`${activeDashboard.id}_${item.id}_${queryRefreshKey}`} 
              item={item} 
              isFirst={idx === 0}
              isLast={idx === currentItems.length - 1}
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
              onEditClick={(targetItem) => handleOpenEditModal(targetItem)}
              onDeleteClick={(targetItem) => setDeletingItem(targetItem)}
            />
          ))}
        </div>
      )}

      {/* Empty State for Active Dashboard */}
      {!loading && currentItems.length === 0 && (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', padding: '50px 20px', textAlign: 'center', maxWidth: '500px', margin: '20px auto 0 auto' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            color: 'var(--accent-cyan)'
          }}>
            <Sparkles style={{ width: '26px', height: '26px' }} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
            No Widgets on "{activeDashboard.name}"
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
            Customize this dashboard view with dynamic SQL tables, sleek line charts, or stat cards.
          </p>

          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add First Widget
          </button>
        </div>
      )}

      {/* Add / Edit Widget Modal */}
      <AddWidgetModal 
        isOpen={isModalOpen} 
        initialData={editingItem}
        dashboardId={activeDashboard.id}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveWidget}
      />

      {/* Reorder Widgets Modal */}
      <ReorderModal
        isOpen={isReorderModalOpen}
        items={currentItems}
        onClose={() => setIsReorderModalOpen(false)}
        onSave={handleSaveOrder}
      />

      {/* Confirm Delete Widget Modal */}
      <ConfirmDeleteModal 
        isOpen={!!deletingItem}
        itemName={deletingItem ? deletingItem.name : ''}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        deleting={isDeleting}
      />

      {/* Create / Rename Dashboard Tab Modal */}
      <DashboardTabModal
        isOpen={isTabModalOpen}
        mode={tabModalMode}
        initialData={editingTab}
        canDelete={dashboards.length > 1}
        onClose={() => {
          setIsTabModalOpen(false);
          setEditingTab(null);
        }}
        onSave={handleSaveTab}
        onDeleteClick={(tab) => setDeletingTab(tab)}
      />

      {/* Confirm Delete Dashboard Tab Modal */}
      <ConfirmDeleteTabModal
        isOpen={!!deletingTab}
        dashboard={deletingTab}
        onClose={() => setDeletingTab(null)}
        onConfirm={handleConfirmDeleteTab}
        deleting={isDeletingTab}
      />

    </div>
  );
}
