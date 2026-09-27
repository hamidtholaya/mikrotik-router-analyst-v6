'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  HardDrive, 
  Clock, 
  X, 
  UserCheck, 
  UserX,
  Layers,
  Sparkles,
  Wifi,
  Radio,
  Loader2
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    disabledUsers: 0,
    totalTrafficFormatted: '0 B'
  });
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalRecords: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  });

  // Filter & Search & Sort states
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  // UI helpers
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'sessions'
  const [subTab, setSubTab] = useState('all');

  // Modal Sessions state (Lazy loaded & paginated)
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionFilterStatus, setSessionFilterStatus] = useState('all');
  const [sessionsPagination, setSessionsPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  });

  useEffect(() => {
    fetchUsers(1);
  }, [selectedProfile, selectedStatus, sortBy, sortDir]);

  useEffect(() => {
    if (selectedUserModal && modalTab === 'sessions') {
      fetchUserSessions(selectedUserModal.id, 1, sessionFilterStatus);
    }
  }, [selectedUserModal, modalTab, sessionFilterStatus]);

  const fetchUsers = async (targetPage = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: pagination.limit.toString(),
        search: search.trim(),
        profile: selectedProfile,
        status: selectedStatus,
        sortBy,
        sortDir
      });

      const res = await fetch(`/api/userman/users?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setUsers(result.data || []);
        if (result.pagination) setPagination(result.pagination);
        if (result.stats) setStats(result.stats);
        if (result.profiles) setProfiles(result.profiles);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSessions = async (userId, targetPage = 1, status = sessionFilterStatus) => {
    setSessionsLoading(true);
    try {
      const params = new URLSearchParams({
        userId: userId.toString(),
        page: targetPage.toString(),
        limit: sessionsPagination.limit.toString(),
        status
      });

      const res = await fetch(`/api/userman/sessions?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setSessions(result.data || []);
        if (result.pagination) setSessionsPagination(result.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleOpenUserModal = (user) => {
    setSelectedUserModal(user);
    setModalTab('details');
    setSessions([]);
    setSessionsPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToCsv = () => {
    if (!users || users.length === 0) return;
    
    const headers = ['ID', 'Username', 'Password', 'Profile', 'Status', 'Download Used', 'Upload Used', 'Uptime'];
    const rows = users.map(u => [
      u.id,
      `"${u.userName || ''}"`,
      `"${u.password || ''}"`,
      `"${u.actualProfileName || 'None'}"`,
      u.statusLabel,
      `"${u.downloadFormatted}"`,
      `"${u.uploadFormatted}"`,
      `"${u.uptimeFormatted}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `userman_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Subnav Module Header */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            User Manager Submodules:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSubTab('all')}
              className="btn btn-secondary" 
              style={{ 
                padding: '6px 14px', 
                fontSize: '0.82rem', 
                borderColor: subTab === 'all' ? 'var(--accent-cyan)' : 'var(--border-color)', 
                color: subTab === 'all' ? 'var(--accent-cyan)' : 'var(--text-muted)' 
              }}
            >
              All Users ({stats.totalUsers})
            </button>
            <button 
              onClick={() => setSubTab('active')}
              className="btn btn-secondary" 
              style={{ 
                padding: '6px 14px', 
                fontSize: '0.82rem', 
                borderColor: subTab === 'active' ? 'var(--accent-emerald)' : 'var(--border-color)', 
                color: subTab === 'active' ? 'var(--accent-emerald)' : 'var(--text-muted)' 
              }}
            >
              Active Users ({stats.activeUsers})
            </button>
            <button 
              onClick={() => setSubTab('disabled')}
              className="btn btn-secondary" 
              style={{ 
                padding: '6px 14px', 
                fontSize: '0.82rem', 
                borderColor: subTab === 'disabled' ? 'var(--accent-rose)' : 'var(--border-color)', 
                color: subTab === 'disabled' ? 'var(--accent-rose)' : 'var(--text-muted)' 
              }}
            >
              Disabled Users ({stats.disabledUsers})
            </button>
          </div>
        </div>

        <button onClick={exportToCsv} className="btn btn-outline-cyan" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
          <Download style={{ width: '14px', height: '14px' }} />
          Export CSV
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Total Accounts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.totalUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
            <UserCheck style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Active Users</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>{stats.activeUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-rose)' }}>
            <UserX style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Disabled Users</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-rose)' }}>{stats.disabledUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
            <HardDrive style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Total Traffic Used</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.totalTrafficFormatted}</div>
          </div>
        </div>

      </div>

      {/* Main Pro Table Container */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '38px' }}
                placeholder="Search by username, name, phone, or comment..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
              Search
            </button>
          </form>

          {/* Filters & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Profile Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter style={{ width: '14px', height: '14px', color: 'var(--text-dim)' }} />
              <select 
                className="input-field" 
                style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
              >
                <option value="all">All Profiles</option>
                {profiles.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <select 
              className="input-field" 
              style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>

            {/* Rows Per Page */}
            <select 
              className="input-field" 
              style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
              value={pagination.limit}
              onChange={(e) => {
                setPagination(prev => ({ ...prev, limit: parseInt(e.target.value, 10) }));
                fetchUsers(1);
              }}
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>

            {/* Refresh */}
            <button onClick={() => fetchUsers(pagination.page)} className="btn btn-secondary" style={{ padding: '8px 12px' }} title="Refresh Users List">
              <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>

          </div>

        </div>

        {/* Pro Data Table */}
        <div style={{ overflowX: 'auto', minHeight: '360px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  ID {sortBy === 'id' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('userName')}>
                  Username / Account {sortBy === 'userName' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th>Password</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('actualProfileName')}>
                  Profile {sortBy === 'actualProfileName' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('downloadUsed')}>
                  Download {sortBy === 'downloadUsed' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('uploadUsed')}>
                  Upload {sortBy === 'uploadUsed' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('uptimeUsed')}>
                  Uptime {sortBy === 'uptimeUsed' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('disabled')}>
                  Status {sortBy === 'disabled' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading users from <code style={{ color: 'var(--accent-cyan)' }}>userman_active.db</code>...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No user accounts found matching your search filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      #{user.id}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{user.userName || 'Unnamed'}</span>
                        <button 
                          onClick={() => copyToClipboard(user.userName, `user_${user.id}`)}
                          style={{ background: 'transparent', border: 'none', color: copiedId === `user_${user.id}` ? 'var(--accent-emerald)' : 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                          title="Copy Username"
                        >
                          {copiedId === `user_${user.id}` ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                        </button>
                      </div>
                      {(user.firstName || user.descr) && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                          {[user.firstName, user.lastName, user.descr].filter(Boolean).join(' ')}
                        </div>
                      )}
                    </td>

                    <td>
                      {user.password ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {visiblePasswords[user.id] ? user.password : '••••••••'}
                          </span>
                          <button 
                            onClick={() => togglePasswordVisibility(user.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                          >
                            {visiblePasswords[user.id] ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', italic: 'true' }}>None</span>
                      )}
                    </td>

                    <td>
                      {user.actualProfileName ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          {user.actualProfileName}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No Profile</span>
                      )}
                    </td>

                    <td style={{ fontWeight: '600' }}>{user.downloadFormatted}</td>
                    <td style={{ fontWeight: '600' }}>{user.uploadFormatted}</td>
                    <td>{user.uptimeFormatted}</td>

                    <td>
                      <span className={`badge badge-${user.statusColor}`}>
                        {user.statusLabel}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleOpenUserModal(user)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{((pagination.page - 1) * pagination.limit) + (users.length > 0 ? 1 : 0)}</strong> to <strong>{((pagination.page - 1) * pagination.limit) + users.length}</strong> of <strong>{pagination.totalRecords.toLocaleString()}</strong> user entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => fetchUsers(1)}
              disabled={!pagination.hasPrev}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="First Page"
            >
              <ChevronsLeft style={{ width: '16px', height: '16px' }} />
            </button>

            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
              Prev
            </button>

            <div style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', background: 'var(--table-row-hover)', borderRadius: '6px' }}>
              Page {pagination.page} of {pagination.totalPages}
            </div>

            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              Next
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>

            <button
              onClick={() => fetchUsers(pagination.totalPages)}
              disabled={!pagination.hasNext}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Last Page"
            >
              <ChevronsRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

        </div>

      </div>

      {/* User Details & Sessions Modal */}
      {selectedUserModal && (
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
            maxWidth: '720px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid var(--border-active)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            
            {/* Modal Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users style={{ width: '22px', height: '22px', color: 'var(--accent-cyan)' }} />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    User Account #{selectedUserModal.id} ({selectedUserModal.userName})
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Profile: {selectedUserModal.actualProfileName || 'None'} &bull; Status: {selectedUserModal.statusLabel}
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedUserModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <button
                onClick={() => setModalTab('details')}
                className="btn btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  borderColor: modalTab === 'details' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: modalTab === 'details' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}
              >
                <Users style={{ width: '15px', height: '15px' }} />
                Account Overview
              </button>

              <button
                onClick={() => setModalTab('sessions')}
                className="btn btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  borderColor: modalTab === 'sessions' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: modalTab === 'sessions' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}
              >
                <Radio style={{ width: '15px', height: '15px' }} />
                Sessions Log
                {sessionsPagination.totalRecords > 0 && (
                  <span className="badge badge-success" style={{ marginLeft: '6px', fontSize: '0.7rem' }}>
                    {sessionsPagination.totalRecords}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: Account Overview */}
            {modalTab === 'details' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Username</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{selectedUserModal.userName}</div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Password</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{selectedUserModal.password || 'None'}</div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Profile</div>
                  <div style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{selectedUserModal.actualProfileName || 'None'}</div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Status</div>
                  <div style={{ fontWeight: '700', color: selectedUserModal.disabled ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    {selectedUserModal.statusLabel}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Download Used</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{selectedUserModal.downloadFormatted}</div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Upload Used</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{selectedUserModal.uploadFormatted}</div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Last MAC Address</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{selectedUserModal.lastMAC || 'N/A'}</div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Uptime Used</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{selectedUserModal.uptimeFormatted}</div>
                </div>
              </div>
            )}

            {/* TAB 2: Sessions Log (Lazy Loaded & Paginated) */}
            {modalTab === 'sessions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Session Filter Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Total Recorded Sessions: <strong>{sessionsPagination.totalRecords.toLocaleString()}</strong>
                  </div>

                  <select
                    className="input-field"
                    style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
                    value={sessionFilterStatus}
                    onChange={(e) => setSessionFilterStatus(e.target.value)}
                  >
                    <option value="all">All Sessions</option>
                    <option value="active">Active / Live Only</option>
                    <option value="closed">Closed Only</option>
                  </select>
                </div>

                {/* Sessions Table */}
                <div style={{ overflowX: 'auto', minHeight: '220px' }}>
                  {sessionsLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                      <Loader2 style={{ width: '22px', height: '22px', animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', color: 'var(--accent-cyan)' }} />
                      Loading user sessions...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                      No sessions recorded for this account.
                    </div>
                  ) : (
                    <table className="data-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>IP Address</th>
                          <th>MAC Address</th>
                          <th>Start Time</th>
                          <th>Duration</th>
                          <th>Total Traffic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((sess) => (
                          <tr key={sess.id}>
                            <td>
                              <span className={`badge badge-${sess.active ? 'emerald' : 'secondary'}`} style={{ fontSize: '0.68rem' }}>
                                {sess.active ? 'Active' : 'Closed'}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{sess.ipAddress}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{sess.macAddress}</td>
                            <td>{sess.startTimeFormatted}</td>
                            <td>{sess.durationFormatted}</td>
                            <td style={{ fontWeight: '700' }}>{sess.totalTrafficFormatted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Mini Pagination Footer */}
                {sessionsPagination.totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Page {sessionsPagination.page} of {sessionsPagination.totalPages}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => fetchUserSessions(selectedUserModal.id, sessionsPagination.page - 1)}
                        disabled={!sessionsPagination.hasPrev || sessionsLoading}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        <ChevronLeft style={{ width: '14px', height: '14px' }} />
                        Prev
                      </button>

                      <button
                        onClick={() => fetchUserSessions(selectedUserModal.id, sessionsPagination.page + 1)}
                        disabled={!sessionsPagination.hasNext || sessionsLoading}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        Next
                        <ChevronRight style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button onClick={() => setSelectedUserModal(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
