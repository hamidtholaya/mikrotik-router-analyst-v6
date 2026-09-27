import { Capacitor, registerPlugin } from '@capacitor/core';

// Register native Android plugin
const MikroTikNative = registerPlugin('MikroTikNative');

/**
 * Returns true if running as an installed native mobile app (Android/iOS)
 */
export function isNativeMobile() {
  if (typeof window === 'undefined') return false;
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
}

/**
 * Optional custom base URL (empty by default for direct operation)
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  const storedUrl = localStorage.getItem('mikrotik_backend_url');
  if (storedUrl && storedUrl.trim()) {
    return storedUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setApiBaseUrl(url) {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('mikrotik_backend_url');
  } else {
    localStorage.setItem('mikrotik_backend_url', url.trim());
  }
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0s';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 && d === 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}

function getStoredCreds() {
  try {
    const saved = localStorage.getItem('mikrotik_saved_creds');
    if (saved) return JSON.parse(saved);
    const session = localStorage.getItem('mikrotik_session');
    if (session) return JSON.parse(session);
  } catch (e) {}
  return { host: '10.20.0.1', port: 8728, user: 'admin', password: '' };
}

/**
 * Handle direct native execution on Android when no PC server is present
 */
async function handleNativeRequest(endpoint, options) {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(endpoint, 'http://localhost');
  const path = urlObj.pathname;
  const params = urlObj.searchParams;

  // 1. Connection Test: /api/mikrotik/test
  if (path === '/api/mikrotik/test') {
    const body = options.body ? JSON.parse(options.body) : {};
    const res = await MikroTikNative.testConnection({
      host: body.host || '10.20.0.1',
      port: parseInt(body.port, 10) || 8728,
      user: body.user || 'admin',
      password: body.password || '',
      tls: !!body.tls
    });
    return new Response(JSON.stringify(res), {
      status: res.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Auth Login: /api/auth/login
  if (path === '/api/auth/login') {
    const body = options.body ? JSON.parse(options.body) : {};
    const res = await MikroTikNative.testConnection({
      host: body.host || '10.20.0.1',
      port: parseInt(body.port, 10) || 8728,
      user: body.user || 'admin',
      password: body.password || '',
      tls: !!body.tls
    });

    if (res.success) {
      const session = {
        user: body.user,
        host: body.host,
        port: body.port,
        tls: body.tls,
        timestamp: Date.now()
      };
      localStorage.setItem('mikrotik_session', JSON.stringify(session));
      return new Response(JSON.stringify({ success: true, session }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: res.error || 'Authentication failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 3. Auth Session: /api/auth/session
  if (path === '/api/auth/session') {
    const session = localStorage.getItem('mikrotik_session');
    if (session) {
      try {
        return new Response(JSON.stringify({ authenticated: true, session: JSON.parse(session) }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {}
    }
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Auth Logout: /api/auth/logout
  if (path === '/api/auth/logout') {
    localStorage.removeItem('mikrotik_session');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 5. FTP Sync: /api/userman/sync
  if (path === '/api/userman/sync') {
    if (method === 'POST') {
      const creds = getStoredCreds();
      const res = await MikroTikNative.syncDatabase({
        host: creds.host || '10.20.0.1',
        ftpPort: 21,
        user: creds.user || 'admin',
        password: creds.password || '',
        remotePath: 'user-manager/sqldb'
      });
      return new Response(JSON.stringify(res), {
        status: res.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const res = await MikroTikNative.getActiveDatabase();
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 6. Backups: /api/userman/backup
  if (path === '/api/userman/backup') {
    if (method === 'POST') {
      const res = await MikroTikNative.createBackup();
      return new Response(JSON.stringify(res), {
        status: res.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const res = await MikroTikNative.getBackups();
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 7. Raw SQL Query: /api/dashboard/query
  if (path === '/api/dashboard/query') {
    const body = options.body ? JSON.parse(options.body) : {};
    const res = await MikroTikNative.executeQuery({
      sql: body.sql,
      dbName: body.dbPath ? body.dbPath.split('/').pop() : 'userman_active.db'
    });
    return new Response(JSON.stringify(res), {
      status: res.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 8. Dashboard Config: /api/dashboard/config
  if (path === '/api/dashboard/config') {
    const STORAGE_KEY = 'mikrotik_dashboard_config';
    let config = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) config = JSON.parse(raw);
    } catch (e) {}

    // Default widgets if empty
    if (!config || config.length === 0) {
      config = [
        {
          id: 'dash_default_1',
          name: 'Database Info & Tables',
          type: 'stat_card',
          dbPath: 'data/userman_active.db',
          sql: "SELECT name FROM sqlite_master WHERE type='table';",
          size: 'third',
          color: 'cyan',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    if (method === 'GET') {
      return new Response(JSON.stringify({ success: true, items: config }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {};
      const newItem = {
        id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: body.name || 'Untitled Widget',
        type: body.type || 'table',
        chartType: body.chartType || 'bar',
        size: body.size || 'full',
        dbPath: body.dbPath || 'data/userman_active.db',
        sql: body.sql || '',
        color: body.color || 'cyan',
        createdAt: new Date().toISOString()
      };
      config.push(newItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return new Response(JSON.stringify({ success: true, item: newItem, items: config }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'PUT') {
      const body = options.body ? JSON.parse(options.body) : {};
      const idx = config.findIndex(item => item.id === body.id);
      if (idx !== -1) {
        config[idx] = { ...config[idx], ...body, updatedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return new Response(JSON.stringify({ success: true, item: config[idx], items: config }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: false, error: 'Widget not found' }), { status: 404 });
    }

    if (method === 'DELETE') {
      const id = params.get('id');
      config = config.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return new Response(JSON.stringify({ success: true, items: config }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 9. Dashboard Reorder: /api/dashboard/config/reorder
  if (path === '/api/dashboard/config/reorder') {
    const STORAGE_KEY = 'mikrotik_dashboard_config';
    const body = options.body ? JSON.parse(options.body) : {};
    const { orderedIds } = body;
    let config = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) config = JSON.parse(raw);
    } catch (e) {}

    if (Array.isArray(orderedIds) && config.length > 0) {
      const itemMap = new Map(config.map(item => [item.id, item]));
      const newItems = [];
      for (const id of orderedIds) {
        if (itemMap.has(id)) {
          newItems.push(itemMap.get(id));
          itemMap.delete(id);
        }
      }
      for (const remaining of itemMap.values()) {
        newItems.push(remaining);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return new Response(JSON.stringify({ success: true, items: newItems }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, items: config }), { status: 200 });
  }

  // 10. Users List: /api/userman/users
  if (path === '/api/userman/users') {
    const page = parseInt(params.get('page'), 10) || 1;
    const limit = parseInt(params.get('limit'), 10) || 25;
    const search = (params.get('search') || '').trim();
    const profile = (params.get('profile') || '').trim();
    const status = (params.get('status') || '').trim();
    const sortBy = params.get('sortBy') || 'id';
    const sortDir = (params.get('sortDir') || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const sortColMap = {
      id: 'id',
      userName: 'CAST(userName AS TEXT)',
      actualProfileName: 'CAST(actualProfileName AS TEXT)',
      disabled: 'disabled',
      downloadUsed: 'downloadUsed',
      uploadUsed: 'uploadUsed',
      uptimeUsed: 'uptimeUsed'
    };
    const safeSortCol = sortColMap[sortBy] || 'id';

    const whereClauses = [];
    if (search) {
      whereClauses.push(`(CAST(userName AS TEXT) LIKE '%${search}%' OR CAST(comment AS TEXT) LIKE '%${search}%')`);
    }
    if (profile && profile !== 'all') {
      whereClauses.push(`CAST(actualProfileName AS TEXT) = '${profile}'`);
    }
    if (status === 'active') {
      whereClauses.push(`disabled = 0`);
    } else if (status === 'disabled') {
      whereClauses.push(`disabled = 1`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT id, 
             CAST(userName AS TEXT) AS userName, 
             password, 
             CAST(actualProfileName AS TEXT) AS actualProfileName, 
             disabled, 
             uptimeUsed, 
             downloadUsed, 
             uploadUsed, 
             CAST(comment AS TEXT) AS comment 
      FROM usermgr_users 
      ${whereStr} 
      ORDER BY ${safeSortCol} ${sortDir} 
      LIMIT ${limit} OFFSET ${offset};
    `;

    const countSql = `SELECT COUNT(*) AS total FROM usermgr_users ${whereStr};`;
    const profilesSql = `SELECT DISTINCT CAST(actualProfileName AS TEXT) AS profileName FROM usermgr_users WHERE actualProfileName IS NOT NULL;`;
    const statsSql = `
      SELECT 
        COUNT(*) AS totalUsers,
        SUM(CASE WHEN disabled = 0 THEN 1 ELSE 0 END) AS activeUsers,
        SUM(CASE WHEN disabled = 1 THEN 1 ELSE 0 END) AS disabledUsers,
        SUM(downloadUsed) AS totalDownload,
        SUM(uploadUsed) AS totalUpload,
        SUM(uptimeUsed) AS totalUptime
      FROM usermgr_users;
    `;

    try {
      const [dataRes, countRes, profRes, statsRes] = await Promise.all([
        MikroTikNative.executeQuery({ sql: dataSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: countSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: profilesSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: statsSql, dbName: 'userman_active.db' })
      ]);

      const total = countRes.rows && countRes.rows[0] ? countRes.rows[0].total : 0;
      const rawUsers = dataRes.rows || [];
      const formattedUsers = rawUsers.map(u => ({
        ...u,
        totalBytes: (u.downloadUsed || 0) + (u.uploadUsed || 0),
        downloadFormatted: formatBytes(u.downloadUsed),
        uploadFormatted: formatBytes(u.uploadUsed),
        totalFormatted: formatBytes((u.downloadUsed || 0) + (u.uploadUsed || 0)),
        uptimeFormatted: formatUptime(u.uptimeUsed)
      }));

      const statRow = statsRes.rows && statsRes.rows[0] ? statsRes.rows[0] : {};
      const profilesList = (profRes.rows || []).map(p => p.profileName).filter(Boolean);

      return new Response(JSON.stringify({
        success: true,
        data: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalUsers: statRow.totalUsers || 0,
          activeUsers: statRow.activeUsers || 0,
          disabledUsers: statRow.disabledUsers || 0,
          totalDownloadFormatted: formatBytes(statRow.totalDownload),
          totalUploadFormatted: formatBytes(statRow.totalUpload),
          totalTrafficFormatted: formatBytes((statRow.totalDownload || 0) + (statRow.totalUpload || 0)),
          totalUptimeFormatted: formatUptime(statRow.totalUptime)
        },
        profiles: profilesList
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
  }

  // 11. Sessions List: /api/userman/sessions
  if (path === '/api/userman/sessions') {
    const userId = params.get('userId');
    const page = parseInt(params.get('page'), 10) || 1;
    const limit = parseInt(params.get('limit'), 10) || 20;
    const status = params.get('status') || 'all';

    const whereClauses = [];
    if (userId) whereClauses.push(`userId = ${parseInt(userId, 10)}`);
    if (status === 'active') whereClauses.push(`active = 1`);
    else if (status === 'closed') whereClauses.push(`active = 0`);

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT id, userId, CAST(userIp AS TEXT) AS userIp, CAST(callingStationId AS TEXT) AS callingStationId,
             uptime, download, upload, active, startTime, stopTime, CAST(terminateCause AS TEXT) AS terminateCause
      FROM usermgr_sessions
      ${whereStr}
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    const countSql = `SELECT COUNT(*) AS total FROM usermgr_sessions ${whereStr};`;

    try {
      const [dataRes, countRes] = await Promise.all([
        MikroTikNative.executeQuery({ sql: dataSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: countSql, dbName: 'userman_active.db' })
      ]);

      const total = countRes.rows && countRes.rows[0] ? countRes.rows[0].total : 0;
      const rawSessions = (dataRes.rows || []).map(s => ({
        ...s,
        downloadFormatted: formatBytes(s.download),
        uploadFormatted: formatBytes(s.upload),
        totalFormatted: formatBytes((s.download || 0) + (s.upload || 0)),
        uptimeFormatted: formatUptime(s.uptime)
      }));

      return new Response(JSON.stringify({
        success: true,
        data: rawSessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
  }

  // Fallback for any unknown route
  return new Response(JSON.stringify({ success: false, error: 'Endpoint not implemented in native mode' }), { status: 404 });
}

/**
 * Unified API Fetch wrapper:
 * - If on Android Native: handles direct RouterOS Socket / FTP / SQLite natively via Java plugin!
 * - If in Web browser: falls back to regular HTTP fetch.
 */
export async function apiFetch(endpoint, options = {}) {
  // If running directly as native Android app without a custom remote backend:
  if (isNativeMobile() && !getApiBaseUrl()) {
    try {
      return await handleNativeRequest(endpoint, options);
    } catch (nativeErr) {
      console.error('[MikroTikNative] Error executing native request:', nativeErr);
      return new Response(JSON.stringify({
        success: false,
        error: nativeErr.message || nativeErr.toString()
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // Web Browser / PC Server Mode
  const baseUrl = getApiBaseUrl();
  const fullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (typeof window !== 'undefined') {
    const sessionData = localStorage.getItem('mikrotik_session');
    if (sessionData && !headers['Authorization']) {
      headers['X-Session-Data'] = sessionData;
    }
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  });
}
