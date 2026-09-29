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

function formatTimestamp(timestamp) {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) return 'N/A';
  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  } catch (err) {
    return 'N/A';
  }
}

function decodeIpAddress(val) {
  if (!val) return 'N/A';
  if (typeof val === 'string') {
    if (val.includes('.')) return val;
    if (val.length === 4) {
      return `${val.charCodeAt(0)}.${val.charCodeAt(1)}.${val.charCodeAt(2)}.${val.charCodeAt(3)}`;
    }
    return val;
  }
  if (Array.isArray(val) && val.length >= 4) {
    return `${val[0]}.${val[1]}.${val[2]}.${val[3]}`;
  }
  if (typeof val === 'number') {
    const b0 = (val >>> 24) & 255;
    const b1 = (val >>> 16) & 255;
    const b2 = (val >>> 8) & 255;
    const b3 = val & 255;
    return `${b0}.${b1}.${b2}.${b3}`;
  }
  return 'N/A';
}

function getStoredCreds() {
  try {
    const active = localStorage.getItem('mikrotik_creds_active');
    if (active) return JSON.parse(active);
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
        password: body.password || '',
        timestamp: Date.now()
      };
      localStorage.setItem('mikrotik_session', JSON.stringify(session));
      localStorage.setItem('mikrotik_creds_active', JSON.stringify({
        host: body.host,
        port: body.port,
        user: body.user,
        password: body.password || '',
        tls: body.tls
      }));

      // Immediately attempt automatic initial FTP sync of user-manager/sqldb
      try {
        await MikroTikNative.syncDatabase({
          host: body.host || '10.20.0.1',
          ftpPort: 21,
          user: body.user || 'admin',
          password: body.password || '',
          remotePath: 'user-manager/sqldb'
        });
      } catch (ftpErr) {
        console.warn('Initial auto-sync warning:', ftpErr);
      }

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
        ftpPort: creds.ftpPort || 21,
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

  // 5b. Database Import: /api/userman/import
  if (path === '/api/userman/import' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body) : {};
    const res = await MikroTikNative.importDatabase({
      base64Data: body.base64Data,
      filename: body.filename || 'userman_active.db'
    });
    return new Response(JSON.stringify(res), {
      status: res.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 5c. Database Export: /api/userman/export
  if (path === '/api/userman/export') {
    const filename = params.get('filename') || 'userman_active.db';
    const res = await MikroTikNative.exportDatabase({ filename });
    return new Response(JSON.stringify(res), {
      status: res.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
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

  // 8. Dashboard Config (Multi-Dashboard Tabs): /api/dashboard/config
  if (path === '/api/dashboard/config') {
    const STORAGE_KEY_V2 = 'mikrotik_dashboards_v2';
    const OLD_STORAGE_KEY = 'mikrotik_dashboard_config';

    const DEFAULT_WIDGET = {
      id: 'dash_default_1',
      name: 'Database Info & Tables',
      type: 'stat_card',
      icon: 'Database',
      color: 'cyan',
      prefix: '',
      suffix: '',
      subtitle: 'Tables in active database',
      dbPath: 'data/userman_active.db',
      sql: "SELECT name FROM sqlite_master WHERE type='table';",
      size: 'third',
      createdAt: new Date().toISOString()
    };

    function loadDashboardsConfig() {
      try {
        const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
        if (v2Raw) {
          const parsed = JSON.parse(v2Raw);
          if (parsed && Array.isArray(parsed.dashboards) && parsed.dashboards.length > 0) {
            return parsed;
          }
        }

        // Migrate old v1 storage if present
        const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
        let oldItems = [];
        if (oldRaw) {
          try { oldItems = JSON.parse(oldRaw); } catch (e) {}
        }
        if (!Array.isArray(oldItems) || oldItems.length === 0) {
          oldItems = [DEFAULT_WIDGET];
        }

        const initialV2 = {
          activeDashboardId: 'dash_main',
          dashboards: [
            {
              id: 'dash_main',
              name: 'General Overview',
              icon: 'LayoutDashboard',
              items: oldItems
            }
          ]
        };
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(initialV2));
        return initialV2;
      } catch (e) {
        return {
          activeDashboardId: 'dash_main',
          dashboards: [{ id: 'dash_main', name: 'General Overview', icon: 'LayoutDashboard', items: [DEFAULT_WIDGET] }]
        };
      }
    }

    function saveDashboardsConfig(data) {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
      // Save active items into old key as fallback
      const active = data.dashboards.find(d => d.id === data.activeDashboardId) || data.dashboards[0];
      if (active) {
        localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(active.items || []));
      }
    }

    let configData = loadDashboardsConfig();

    if (method === 'GET') {
      return new Response(JSON.stringify({ 
        success: true, 
        config: configData,
        dashboards: configData.dashboards, 
        activeDashboardId: configData.activeDashboardId 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {};

      // 1. Create Dashboard Tab
      if (body.action === 'create_dashboard') {
        const newDash = {
          id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: (body.name || 'New Dashboard').trim(),
          icon: body.icon || 'LayoutDashboard',
          items: []
        };
        configData.dashboards.push(newDash);
        configData.activeDashboardId = newDash.id;
        saveDashboardsConfig(configData);
        return new Response(JSON.stringify({
          success: true,
          dashboard: newDash,
          dashboards: configData.dashboards,
          activeDashboardId: configData.activeDashboardId
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 2. Rename Dashboard Tab
      if (body.action === 'rename_dashboard') {
        const dash = configData.dashboards.find(d => d.id === body.dashboardId);
        if (dash) {
          if (body.name) dash.name = body.name.trim();
          if (body.icon) dash.icon = body.icon;
          saveDashboardsConfig(configData);
          return new Response(JSON.stringify({
            success: true,
            dashboards: configData.dashboards,
            activeDashboardId: configData.activeDashboardId
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, error: 'Dashboard not found' }), { status: 404 });
      }

      // 3. Delete Dashboard Tab
      if (body.action === 'delete_dashboard') {
        if (configData.dashboards.length <= 1) {
          return new Response(JSON.stringify({ success: false, error: 'Cannot delete the only dashboard.' }), { status: 400 });
        }
        configData.dashboards = configData.dashboards.filter(d => d.id !== body.dashboardId);
        if (configData.activeDashboardId === body.dashboardId) {
          configData.activeDashboardId = configData.dashboards[0].id;
        }
        saveDashboardsConfig(configData);
        return new Response(JSON.stringify({
          success: true,
          dashboards: configData.dashboards,
          activeDashboardId: configData.activeDashboardId
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 3b. Move Widget between Dashboards
      if (body.action === 'move_widget') {
        const { itemId, fromDashboardId, toDashboardId } = body;
        const sourceDash = configData.dashboards.find(d => d.id === fromDashboardId);
        const targetDash = configData.dashboards.find(d => d.id === toDashboardId);

        if (sourceDash && targetDash) {
          const itemIdx = sourceDash.items.findIndex(item => item.id === itemId);
          if (itemIdx !== -1) {
            const [item] = sourceDash.items.splice(itemIdx, 1);
            targetDash.items.push(item);
            saveDashboardsConfig(configData);
            return new Response(JSON.stringify({
              success: true,
              message: 'Widget moved successfully.',
              dashboards: configData.dashboards,
              activeDashboardId: configData.activeDashboardId
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }
        return new Response(JSON.stringify({ success: false, error: 'Widget or dashboard not found' }), { status: 400 });
      }

      // 3bb. Duplicate Widget
      if (body.action === 'duplicate_widget') {
        const { itemId, dashboardId } = body;
        const targetId = dashboardId || configData.activeDashboardId;
        const dash = configData.dashboards.find(d => d.id === targetId) || configData.dashboards[0];

        if (dash) {
          const itemIdx = dash.items.findIndex(item => item.id === itemId);
          if (itemIdx !== -1) {
            const original = dash.items[itemIdx];
            const duplicated = {
              ...original,
              id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: `${original.name} (Copy)`,
              createdAt: new Date().toISOString()
            };
            dash.items.splice(itemIdx + 1, 0, duplicated);
            saveDashboardsConfig(configData);
            return new Response(JSON.stringify({
              success: true,
              message: `Duplicated widget "${duplicated.name}".`,
              item: duplicated,
              dashboards: configData.dashboards,
              activeDashboardId: configData.activeDashboardId
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }
        return new Response(JSON.stringify({ success: false, error: 'Widget not found' }), { status: 400 });
      }

      // 3c. Import Full configs.json
      if (body.action === 'import_config') {
        if (body.configData) {
          let imported = body.configData;
          if (!imported.dashboards && Array.isArray(imported)) {
            imported = {
              activeDashboardId: 'dash_main',
              dashboards: [{ id: 'dash_main', name: 'General Overview', icon: 'LayoutDashboard', items: imported }]
            };
          }
          configData = imported;
          saveDashboardsConfig(configData);
          return new Response(JSON.stringify({
            success: true,
            dashboards: configData.dashboards,
            activeDashboardId: configData.activeDashboardId
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, error: 'Invalid config data' }), { status: 400 });
      }

      // 4. Add Widget to Dashboard
      const targetId = body.dashboardId || configData.activeDashboardId;
      const targetDash = configData.dashboards.find(d => d.id === targetId) || configData.dashboards[0];

      const newItem = {
        id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: body.name || 'Untitled Widget',
        type: body.type || 'table',
        chartType: body.chartType || 'bar',
        icon: body.icon || 'Activity',
        prefix: body.prefix || '',
        suffix: body.suffix || '',
        subtitle: body.subtitle || '',
        xAxisCol: body.xAxisCol || '',
        yAxisCols: Array.isArray(body.yAxisCols) ? body.yAxisCols : [],
        dualAxis: !!body.dualAxis,
        chartMode: body.chartMode || 'grouped',
        size: body.size || (body.type === 'section_divider' ? 'full' : 'half'),
        dbPath: body.dbPath || 'data/userman_active.db',
        sql: body.type === 'section_divider' ? '' : (body.sql || ''),
        color: body.color || 'cyan',
        fontSize: body.fontSize || 'standard',
        sectionStyle: body.sectionStyle || 'line',
        createdAt: new Date().toISOString()
      };

      targetDash.items.push(newItem);
      saveDashboardsConfig(configData);

      return new Response(JSON.stringify({ 
        success: true, 
        item: newItem, 
        dashboards: configData.dashboards,
        activeDashboardId: configData.activeDashboardId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'PUT') {
      const body = options.body ? JSON.parse(options.body) : {};
      const targetId = body.dashboardId || configData.activeDashboardId;
      const targetDash = configData.dashboards.find(d => d.id === targetId) || configData.dashboards[0];

      if (targetDash) {
        const idx = targetDash.items.findIndex(item => item.id === body.id);
        if (idx !== -1) {
          targetDash.items[idx] = { 
            ...targetDash.items[idx], 
            ...body, 
            updatedAt: new Date().toISOString() 
          };
          saveDashboardsConfig(configData);
          return new Response(JSON.stringify({ 
            success: true, 
            item: targetDash.items[idx], 
            dashboards: configData.dashboards,
            activeDashboardId: configData.activeDashboardId
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      return new Response(JSON.stringify({ success: false, error: 'Widget not found' }), { status: 404 });
    }

    if (method === 'DELETE') {
      const id = params.get('id');
      const targetId = params.get('dashboardId');

      for (const dash of configData.dashboards) {
        if (!targetId || dash.id === targetId) {
          dash.items = dash.items.filter(item => item.id !== id);
        }
      }
      saveDashboardsConfig(configData);
      return new Response(JSON.stringify({ 
        success: true, 
        dashboards: configData.dashboards,
        activeDashboardId: configData.activeDashboardId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 9. Dashboard Reorder: /api/dashboard/config/reorder
  if (path === '/api/dashboard/config/reorder') {
    const STORAGE_KEY_V2 = 'mikrotik_dashboards_v2';
    const body = options.body ? JSON.parse(options.body) : {};
    const { orderedIds, dashboardId } = body;
    let configData = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V2);
      if (raw) configData = JSON.parse(raw);
    } catch (e) {}

    if (configData && Array.isArray(orderedIds)) {
      const targetId = dashboardId || configData.activeDashboardId;
      const targetDash = configData.dashboards.find(d => d.id === targetId) || configData.dashboards[0];
      if (targetDash) {
        const itemMap = new Map(targetDash.items.map(item => [item.id, item]));
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
        targetDash.items = newItems;
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(configData));
      }
    }
    return new Response(JSON.stringify({ success: true, dashboards: configData ? configData.dashboards : [] }), { status: 200 });
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
      const escaped = search.replace(/'/g, "''");
      whereClauses.push(`(
        CAST(userName AS TEXT) LIKE '%${escaped}%' OR 
        CAST(firstName AS TEXT) LIKE '%${escaped}%' OR 
        CAST(lastName AS TEXT) LIKE '%${escaped}%' OR 
        CAST(phone AS TEXT) LIKE '%${escaped}%' OR 
        CAST(email AS TEXT) LIKE '%${escaped}%' OR 
        CAST(descr AS TEXT) LIKE '%${escaped}%' OR 
        CAST(actualProfileName AS TEXT) LIKE '%${escaped}%'
      )`);
    }
    if (profile && profile !== 'all') {
      const escapedProfile = profile.replace(/'/g, "''");
      whereClauses.push(`CAST(actualProfileName AS TEXT) = '${escapedProfile}'`);
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
             custId,
             CAST(userName AS TEXT) AS userName, 
             CAST(password AS TEXT) AS password, 
             disabled, 
             CAST(firstName AS TEXT) AS firstName,
             CAST(lastName AS TEXT) AS lastName,
             CAST(phone AS TEXT) AS phone,
             CAST(email AS TEXT) AS email,
             CAST(descr AS TEXT) AS descr,
             downloadUsed, 
             uploadUsed, 
             uptimeUsed, 
             CAST(actualProfileName AS TEXT) AS actualProfileName, 
             profileTillTime,
             profileTimeLeft,
              lastSeenAt,
              CAST(lastIp AS TEXT) AS lastIp,
              CAST(lastMAC AS TEXT) AS lastMAC 
      FROM user 
      ${whereStr} 
      ORDER BY ${safeSortCol} ${sortDir} 
      LIMIT ${limit} OFFSET ${offset};
    `;

    const countSql = `SELECT COUNT(*) AS total FROM user ${whereStr};`;
    const profilesSql = `SELECT DISTINCT CAST(actualProfileName AS TEXT) AS profileName FROM user WHERE actualProfileName IS NOT NULL;`;
    const statsSql = `
      SELECT 
        COUNT(*) AS totalUsers,
        SUM(CASE WHEN disabled = 0 THEN 1 ELSE 0 END) AS activeUsers,
        SUM(CASE WHEN disabled = 1 THEN 1 ELSE 0 END) AS disabledUsers,
        SUM(downloadUsed) AS totalDownload,
        SUM(uploadUsed) AS totalUpload,
        SUM(uptimeUsed) AS totalUptime
      FROM user;
    `;

    try {
      const [dataRes, countRes, profRes, statsRes] = await Promise.all([
        MikroTikNative.executeQuery({ sql: dataSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: countSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: profilesSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: statsSql, dbName: 'userman_active.db' })
      ]);

      if (dataRes && dataRes.success === false) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: dataRes.error || 'Database file userman_active.db does not exist. Tap "Reload & Replace Active sqldb" in Settings first.' 
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      if (countRes && countRes.success === false) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: countRes.error || 'Failed to query user database.' 
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const total = countRes.rows && countRes.rows[0] ? (countRes.rows[0].total || 0) : 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const currentPage = Math.max(1, Math.min(page, totalPages));

      const rawUsers = dataRes.rows || [];
      const formattedUsers = rawUsers.map(u => ({
        ...u,
        totalBytes: (u.downloadUsed || 0) + (u.uploadUsed || 0),
        downloadFormatted: formatBytes(u.downloadUsed),
        uploadFormatted: formatBytes(u.uploadUsed),
        totalFormatted: formatBytes((u.downloadUsed || 0) + (u.uploadUsed || 0)),
        totalUsedFormatted: formatBytes((u.downloadUsed || 0) + (u.uploadUsed || 0)),
        uptimeFormatted: formatUptime(u.uptimeUsed),
        statusLabel: u.disabled === 1 ? 'Disabled' : 'Active',
        statusColor: u.disabled === 1 ? 'rose' : 'emerald'
      }));

      const statRow = statsRes.rows && statsRes.rows[0] ? statsRes.rows[0] : {};
      const profilesList = (profRes.rows || []).map(p => p.profileName).filter(Boolean);

      return new Response(JSON.stringify({
        success: true,
        data: formattedUsers,
        pagination: {
          page: currentPage,
          limit,
          total,
          totalRecords: total,
          totalPages,
          hasPrev: currentPage > 1,
          hasNext: currentPage < totalPages
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
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // 11. Sessions List: /api/userman/sessions
  if (path === '/api/userman/sessions') {
    const userId = params.get('userId');
    const page = parseInt(params.get('page'), 10) || 1;
    const limit = parseInt(params.get('limit'), 10) || 10;
    const status = (params.get('status') || '').trim();

    const whereClauses = [];
    if (userId) whereClauses.push(`userId = ${parseInt(userId, 10)}`);
    if (status === 'active') whereClauses.push(`active = 1`);
    else if (status === 'closed') whereClauses.push(`active = 0`);

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT id, 
             userId, 
             active, 
             fromTime, 
             tillTime, 
             upTime, 
             bytesDownload, 
             bytesUpload, 
             CAST(callingStationId AS TEXT) AS mac, 
             ipUser 
      FROM session
      ${whereStr}
      ORDER BY fromTime DESC, id DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    const countSql = `SELECT COUNT(*) AS total FROM session ${whereStr};`;

    try {
      const [dataRes, countRes] = await Promise.all([
        MikroTikNative.executeQuery({ sql: dataSql, dbName: 'userman_active.db' }),
        MikroTikNative.executeQuery({ sql: countSql, dbName: 'userman_active.db' })
      ]);

      if (dataRes && dataRes.success === false) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: dataRes.error || 'Failed to query user sessions.' 
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      if (countRes && countRes.success === false) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: countRes.error || 'Failed to count user sessions.' 
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const total = countRes.rows && countRes.rows[0] ? (countRes.rows[0].total || 0) : 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const currentPage = Math.max(1, Math.min(page, totalPages));

      const rawSessions = (dataRes.rows || []).map(s => ({
        id: s.id,
        userId: s.userId,
        active: s.active === 1,
        ipAddress: decodeIpAddress(s.ipUser),
        macAddress: s.mac || 'N/A',
        startTimeFormatted: formatTimestamp(s.fromTime),
        endTimeFormatted: s.active === 1 ? 'Active Session' : formatTimestamp(s.tillTime),
        durationFormatted: formatUptime(s.upTime),
        downloadFormatted: formatBytes(s.bytesDownload),
        uploadFormatted: formatBytes(s.bytesUpload),
        totalTrafficFormatted: formatBytes((s.bytesDownload || 0) + (s.bytesUpload || 0))
      }));

      return new Response(JSON.stringify({
        success: true,
        data: rawSessions,
        pagination: {
          page: currentPage,
          limit,
          total,
          totalRecords: total,
          totalPages,
          hasPrev: currentPage > 1,
          hasNext: currentPage < totalPages
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // Fallback for any unknown route
  return new Response(JSON.stringify({ success: false, error: 'Endpoint not implemented in native mode' }), { status: 404 });
}

/**
 * Universal file saver & sharer:
 * - On Native Android: writes to public Downloads folder & invokes native Android Share Sheet!
 * - On PC / Web: triggers regular browser download.
 */
export async function exportAndSaveFile({ filename, data, mimeType = 'application/octet-stream', title = 'Exported File' }) {
  if (isNativeMobile()) {
    try {
      let base64Str = '';
      if (typeof data === 'string') {
        // UTF-8 string to base64
        base64Str = btoa(unescape(encodeURIComponent(data)));
      } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(data);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Str = btoa(binary);
      } else if (data && data.base64) {
        base64Str = data.base64;
      }

      const res = await MikroTikNative.saveAndShareFile({
        filename,
        base64: base64Str,
        mimeType,
        title
      });

      return {
        success: true,
        message: res.message || `File saved to ${res.location || 'Downloads'} and opened in Share menu!`,
        location: res.location || 'Downloads/' + filename
      };
    } catch (nativeErr) {
      console.error('[MikroTikNative] Error in saveAndShareFile:', nativeErr);
      // Fallback to web download if native share fails
    }
  }

  // Web Browser fallback
  let blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: mimeType });
  } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    blob = new Blob([data], { type: mimeType });
  } else if (data && data.base64) {
    const byteCharacters = atob(data.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    success: true,
    message: `Exported ${filename} successfully!`,
    location: 'Downloads'
  };
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
