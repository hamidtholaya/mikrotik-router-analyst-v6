'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import WidgetCard from '../components/dashboard/WidgetCard';
import AddWidgetModal from '../components/dashboard/AddWidgetModal';
import ConfirmDeleteModal from '../components/dashboard/ConfirmDeleteModal';
import ReorderModal from '../components/dashboard/ReorderModal';
import { apiFetch } from '../lib/apiClient';

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeDb, setActiveDb] = useState(null);
  const [syncingDb, setSyncingDb] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [syncErr, setSyncErr] = useState(null);

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
        setSyncMsg('Database downloaded successfully from router! Loading widgets...');
        if (data.activeDb) setActiveDb(data.activeDb);
        // Refresh dashboard items to re-run queries
        await fetchDashboardConfig();
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
      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load dashboard config:', err);
    } finally {
      setLoading(false);
    }
  };

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
        body: JSON.stringify(widgetData)
      });
      const data = await res.json();

      if (data.success && data.items) {
        setItems(data.items);
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
        body: JSON.stringify({ orderedIds })
      });
      const data = await res.json();

      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Reorder save error:', err);
    }
  };

  const handleMoveLeft = async (id) => {
    const idx = items.findIndex(item => item.id === id);
    if (idx <= 0) return;

    const newItems = [...items];
    const temp = newItems[idx - 1];
    newItems[idx - 1] = newItems[idx];
    newItems[idx] = temp;

    setItems(newItems);
    await handleSaveOrder(newItems.map(item => item.id));
  };

  const handleMoveRight = async (id) => {
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1 || idx >= items.length - 1) return;

    const newItems = [...items];
    const temp = newItems[idx + 1];
    newItems[idx + 1] = newItems[idx];
    newItems[idx] = temp;

    setItems(newItems);
    await handleSaveOrder(newItems.map(item => item.id));
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    try {
      const res = await apiFetch(`/api/dashboard/config?id=${deletingItem.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Delete widget error:', err);
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Dashboard Top Control Bar */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard style={{ color: 'var(--accent-cyan)', width: '24px', height: '24px' }} />
            Router Manager Dashboard
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Dynamic widgets executing live queries against SQLite databases (Default: <code style={{ color: 'var(--accent-cyan)' }}>data/userman_active.db</code>)
          </p>
        </div>

        {/* Top Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {items.length > 1 && (
            <button
              onClick={() => setIsReorderModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              title="Reorder dashboard widgets"
            >
              <ArrowUpDown style={{ width: '16px', height: '16px', color: 'var(--accent-cyan)' }} />
              Reorder
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.88rem' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            Add Item
          </button>
        </div>
      </div>

      {/* Database Status & Quick Sync Notification Banner */}
      {syncMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          color: '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 style={{ width: '20px', height: '20px', color: 'var(--accent-emerald)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem' }}>{syncMsg}</div>
        </div>
      )}

      {syncErr && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--accent-rose)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.88rem' }}>{syncErr}</div>
          </div>
          <button
            onClick={handleSyncDatabase}
            disabled={syncingDb}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
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
            <AlertCircle style={{ color: 'var(--accent-rose)', width: '24px', height: '24px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                User Manager Database not synced yet
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Download <code style={{ color: 'var(--accent-cyan)' }}>user-manager/sqldb</code> directly from your router into your phone to enable all widgets.
              </div>
            </div>
          </div>
          <button
            onClick={handleSyncDatabase}
            disabled={syncingDb}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
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

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <Loader2 style={{ width: '28px', height: '28px', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto', color: 'var(--accent-cyan)' }} />
          Loading dashboard items...
        </div>
      )}

      {/* Dashboard Items Grid */}
      {!loading && items.length > 0 && (
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          {items.map((item, idx) => (
            <WidgetCard 
              key={item.id} 
              item={item} 
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
              onEditClick={(targetItem) => handleOpenEditModal(targetItem)}
              onDeleteClick={(targetItem) => setDeletingItem(targetItem)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', padding: '60px 20px', textAlign: 'center', maxWidth: '520px', margin: '30px auto 0 auto' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--accent-cyan)'
          }}>
            <Sparkles style={{ width: '28px', height: '28px' }} />
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
            No Dashboard Items Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
            Click the <strong>"+ Add Item"</strong> button to create your first dynamic SQL table, stat card, or chart widget.
          </p>

          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add First Item
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddWidgetModal 
        isOpen={isModalOpen} 
        initialData={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveWidget}
      />

      {/* Reorder Modal */}
      <ReorderModal
        isOpen={isReorderModalOpen}
        items={items}
        onClose={() => setIsReorderModalOpen(false)}
        onSave={handleSaveOrder}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal 
        isOpen={!!deletingItem}
        itemName={deletingItem ? deletingItem.name : ''}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        deleting={isDeleting}
      />

    </div>
  );
}
