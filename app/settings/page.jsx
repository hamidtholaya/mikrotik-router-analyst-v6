'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  HardDrive, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const [activeDb, setActiveDb] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [syncRes, backupRes] = await Promise.all([
        fetch('/api/userman/sync'),
        fetch('/api/userman/backup')
      ]);

      const syncData = await syncRes.json();
      const backupData = await backupRes.json();

      if (syncData.activeDb) setActiveDb(syncData.activeDb);
      if (backupData.backups) setBackups(backupData.backups);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadActiveDb = async () => {
    setSyncing(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/userman/sync', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setMessage('Successfully downloaded user-manager/sqldb and replaced userman_active.db');
        if (data.activeDb) setActiveDb(data.activeDb);
      } else {
        setError(data.error || 'Failed to reload database from router.');
      }
    } catch (err) {
      setError('Network error trying to reload database.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/userman/backup', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setMessage(`Created backup: ${data.backup.backupFileName || data.backup.filename}`);
        if (data.backups) setBackups(data.backups);
      } else {
        setError(data.error || 'Failed to create timestamped backup.');
      }
    } catch (err) {
      setError('Network error creating backup.');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
          Database & App Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage local User Manager <code style={{ color: 'var(--accent-cyan)' }}>user-manager/sqldb</code> active files and timestamped backups.
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          color: '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--accent-emerald)' }} />
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--accent-rose)' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Grid panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Active Database Card (Fixed Filename) */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database style={{ color: 'var(--accent-cyan)', width: '22px', height: '22px' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)' }}>Active Local Database</h2>
            </div>
            <span className="badge badge-success">Fixed Contract</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            This is the main fixed file (<code style={{ color: 'var(--accent-cyan)' }}>data/userman_active.db</code>) that all user management, hotspot, and profile pages read from.
          </p>

          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>File Name:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>userman_active.db</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>File Status:</span>
              <span style={{ color: activeDb && activeDb.exists ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: '600' }}>
                {activeDb && activeDb.exists ? 'Present & Ready' : 'Not Synced Yet'}
              </span>
            </div>

            {activeDb && activeDb.exists && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>File Size:</span>
                  <span style={{ color: 'var(--text-main)' }}>{activeDb.sizeFormatted}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Last Synced:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(activeDb.lastModified).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleReloadActiveDb}
            disabled={syncing}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'auto' }}
          >
            {syncing ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Downloading sqldb...
              </>
            ) : (
              <>
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Reload & Replace Active sqldb
              </>
            )}
          </button>
        </div>

        {/* Timestamped Backup Card */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive style={{ color: 'var(--accent-purple)', width: '22px', height: '22px' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#fff' }}>Timestamped Backups</h2>
            </div>
            <span className="badge badge-warning">{backups.length} Saved</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Create point-in-time snapshot backups of <code style={{ color: 'var(--accent-purple)' }}>user-manager/sqldb</code> saved with date and time in the filename.
          </p>

          <button
            onClick={handleCreateBackup}
            disabled={backingUp}
            className="btn btn-secondary"
            style={{ width: '100%', borderColor: 'var(--accent-purple)', color: '#fff' }}
          >
            {backingUp ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Creating Backup...
              </>
            ) : (
              <>
                <Download style={{ width: '16px', height: '16px', color: 'var(--accent-purple)' }} />
                Create Timestamped Backup
              </>
            )}
          </button>

          {/* Backup History List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {backups.map((item, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText style={{ width: '14px', height: '14px', color: 'var(--accent-cyan)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{item.filename}</span>
                </div>
                <div style={{ color: 'var(--text-dim)' }}>{item.sizeFormatted}</div>
              </div>
            ))}

            {backups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                No timestamped backups created yet.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
