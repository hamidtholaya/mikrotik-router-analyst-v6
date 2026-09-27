'use client';

import { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Smartphone,
  Globe,
  Wifi,
  Upload,
  FolderDown,
  LayoutDashboard
} from 'lucide-react';
import { apiFetch, isNativeMobile, getApiBaseUrl, setApiBaseUrl } from '../lib/apiClient';

export default function SettingsPage() {
  const [activeDb, setActiveDb] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportingConfig, setExportingConfig] = useState(false);
  const [importingConfig, setImportingConfig] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrlState] = useState('');
  const [isMobileEnv, setIsMobileEnv] = useState(false);
  const [urlSavedMessage, setUrlSavedMessage] = useState(false);
  const fileInputRef = useRef(null);
  const configFileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
    setIsMobileEnv(isNativeMobile());
    setBackendUrlState(getApiBaseUrl());
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [syncRes, backupRes] = await Promise.all([
        apiFetch('/api/userman/sync'),
        apiFetch('/api/userman/backup')
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

  const handleSaveBackendUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(backendUrl);
    setUrlSavedMessage(true);
    setTimeout(() => setUrlSavedMessage(false), 3000);
    fetchData();
  };

  const handleReloadActiveDb = async () => {
    setSyncing(true);
    setMessage(null);
    setError(null);

    try {
      const res = await apiFetch('/api/userman/sync', { method: 'POST' });
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
      const res = await apiFetch('/api/userman/backup', { method: 'POST' });
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

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resultStr = reader.result;
        const base64Data = resultStr.split(',')[1];
        const res = await apiFetch('/api/userman/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            filename: 'userman_active.db'
          })
        });
        const data = await res.json();
        if (data.success) {
          setMessage(`Successfully imported "${file.name}" as active database!`);
          if (data.activeDb) setActiveDb(data.activeDb);
        } else {
          setError(data.error || 'Failed to import database file.');
        }
      } catch (err) {
        setError('Error reading or saving file: ' + err.message);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from device storage.');
      setImporting(false);
    };
    reader.readAsDataURL(file);
  };

  const handleExportFile = async (filename = 'userman_active.db') => {
    try {
      const res = await apiFetch(`/api/userman/export?filename=${encodeURIComponent(filename)}`);
      const data = await res.json();
      if (data.success && data.base64) {
        const byteCharacters = atob(data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMessage(`Exported ${filename} successfully!`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to export database.');
      }
    } catch (e) {
      setError('Export failed: ' + e.message);
    }
  };

  const handleExportConfigsJson = async () => {
    setExportingConfig(true);
    setMessage(null);
    setError(null);
    try {
      const res = await apiFetch('/api/dashboard/config');
      const data = await res.json();
      if (data.success && (data.config || data.dashboards)) {
        const configToExport = data.config || {
          activeDashboardId: data.activeDashboardId || 'dash_main',
          dashboards: data.dashboards
        };
        const jsonStr = JSON.stringify(configToExport, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `configs_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMessage('Successfully exported configs.json backup file!');
        setTimeout(() => setMessage(null), 4000);
      } else {
        setError(data.error || 'Failed to read configuration data.');
      }
    } catch (err) {
      setError('Export failed: ' + err.message);
    } finally {
      setExportingConfig(false);
    }
  };

  const handleImportConfigsJson = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImportingConfig(true);
    setMessage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('File content is not valid JSON.');
        }

        // Validate structure: must have dashboards array or items
        if (!parsed.dashboards && !Array.isArray(parsed)) {
          throw new Error('Invalid configs format: Expected "dashboards" array.');
        }

        const res = await apiFetch('/api/dashboard/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'import_config',
            configData: parsed
          })
        });

        const data = await res.json();
        if (data.success) {
          setMessage(`Successfully imported "${file.name}"! Dashboards and widget configurations restored.`);
          setTimeout(() => setMessage(null), 5000);
        } else {
          setError(data.error || 'Failed to import configuration file.');
        }
      } catch (err) {
        setError('Error importing configs.json: ' + (err.message || 'Invalid JSON file'));
      } finally {
        setImportingConfig(false);
        if (configFileInputRef.current) configFileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from device storage.');
      setImportingConfig(false);
    };
    reader.readAsText(file);
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

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".db,.sqlite,*"
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            <button
              onClick={handleReloadActiveDb}
              disabled={syncing || importing}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {syncing ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Downloading sqldb via FTP...
                </>
              ) : (
                <>
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  Sync from Router (FTP)
                </>
              )}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing || syncing}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                title="Select a .db or sqldb file from your phone storage"
              >
                {importing ? (
                  <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Upload style={{ width: '14px', height: '14px', color: 'var(--accent-cyan)' }} />
                )}
                Import .db
              </button>

              <button
                onClick={() => handleExportFile('userman_active.db')}
                disabled={!activeDb || !activeDb.exists}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                title="Export active database to your phone storage"
              >
                <FolderDown style={{ width: '14px', height: '14px', color: 'var(--accent-emerald)' }} />
                Export DB
              </button>
            </div>
          </div>
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
            Create point-in-time snapshot backups of <code style={{ color: 'var(--accent-purple)' }}>user-manager/sqldb</code> saved on your phone.
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
              <div key={idx} className="glass-card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <FileText style={{ width: '14px', height: '14px', color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.filename}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ color: 'var(--text-dim)' }}>{item.sizeFormatted}</span>
                  <button
                    onClick={() => handleExportFile(item.filename)}
                    style={{
                      background: 'rgba(6, 182, 212, 0.12)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: 'var(--accent-cyan)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Export backup to phone"
                  >
                    <Download style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>
            ))}

            {backups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                No timestamped backups created yet.
              </div>
            )}
          </div>

        </div>

        {/* Dashboard Configurations (configs.json) Card */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutDashboard style={{ color: 'var(--accent-cyan)', width: '22px', height: '22px' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)' }}>Dashboard Configurations</h2>
            </div>
            <span className="badge badge-success">configs.json</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Export and import all your dashboard tabs, custom widgets, SQL queries, and color themes. Back up your layout or easily transfer it between devices.
          </p>

          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Config File:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>data/configs.json</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Scope:</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>All Dashboards & Widgets</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Compatibility:</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>Web & Mobile App</span>
            </div>
          </div>

          <input
            type="file"
            ref={configFileInputRef}
            onChange={handleImportConfigsJson}
            accept=".json,application/json"
            style={{ display: 'none' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
            <button
              onClick={handleExportConfigsJson}
              disabled={exportingConfig || importingConfig}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              title="Download configs.json backup file"
            >
              {exportingConfig ? (
                <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
              ) : (
                <FolderDown style={{ width: '15px', height: '15px', color: 'var(--accent-cyan)' }} />
              )}
              Export Config
            </button>

            <button
              onClick={() => configFileInputRef.current?.click()}
              disabled={importingConfig || exportingConfig}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              title="Import a configs.json file from storage"
            >
              {importingConfig ? (
                <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Upload style={{ width: '15px', height: '15px' }} />
              )}
              Import Config
            </button>
          </div>
        </div>

        {/* Mobile & Network Server Card */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone style={{ color: 'var(--accent-emerald)', width: '22px', height: '22px' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)' }}>Mobile & Network Connection</h2>
            </div>
            <span className={`badge ${isMobileEnv ? 'badge-success' : 'badge-warning'}`}>
              {isMobileEnv ? 'Capacitor Android Native' : 'Web Browser Mode'}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {isMobileEnv ? (
              <>Running in <strong>100% Standalone Native Mode</strong>. Your phone communicates directly with MikroTik via raw TCP sockets (port 8728) and syncs <code style={{ color: 'var(--accent-cyan)' }}>user-manager/sqldb</code> via FTP directly into device storage with on-device SQLite. No PC server required.</>
            ) : (
              <>Manage backend API endpoints or use default local Next.js routing.</>
            )}
          </p>

          <form onSubmit={handleSaveBackendUrl} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Optional Custom Server Relay (Leave blank for direct standalone mode)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Globe style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrlState(e.target.value)}
                    placeholder="Leave blank for Direct Standalone Phone Mode"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
                  Save
                </button>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Leave blank to run 100% standalone directly on your mobile device.
              </span>
            </div>

            {urlSavedMessage && (
              <div style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                Server endpoint saved successfully!
              </div>
            )}
          </form>
        </div>

      </div>

    </div>
  );
}
