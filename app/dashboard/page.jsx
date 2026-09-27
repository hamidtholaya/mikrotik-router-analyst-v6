'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Sparkles, 
  Loader2,
  ArrowUpDown
} from 'lucide-react';
import WidgetCard from '../components/dashboard/WidgetCard';
import AddWidgetModal from '../components/dashboard/AddWidgetModal';
import ConfirmDeleteModal from '../components/dashboard/ConfirmDeleteModal';
import ReorderModal from '../components/dashboard/ReorderModal';

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDashboardConfig();
  }, []);

  const fetchDashboardConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/config');
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

      const res = await fetch(url, {
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
      const res = await fetch('/api/dashboard/config/reorder', {
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
      const res = await fetch(`/api/dashboard/config?id=${deletingItem.id}`, {
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
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard style={{ color: 'var(--accent-cyan)', width: '24px', height: '24px' }} />
            Router Manager Dashboard
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Dynamic widgets executing live queries against SQLite databases (Default: <code style={{ color: 'var(--accent-cyan)' }}>data/userman_active.db</code>)
          </p>
        </div>

        {/* Top Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {items.length > 1 && (
            <button
              onClick={() => setIsReorderModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.9rem' }}
              title="Reorder dashboard widgets"
            >
              <ArrowUpDown style={{ width: '16px', height: '16px', color: 'var(--accent-cyan)' }} />
              Reorder
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            Add Item
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <Loader2 style={{ width: '28px', height: '28px', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto', color: 'var(--accent-cyan)' }} />
          Loading dashboard items...
        </div>
      )}

      {/* Dashboard Items Grid */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
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
