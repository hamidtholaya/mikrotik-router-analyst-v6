import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'configs.json');

const DEFAULT_ITEM = {
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

function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      activeDashboardId: 'dash_default',
      dashboards: [
        {
          id: 'dash_default',
          name: 'Main Overview',
          icon: 'LayoutDashboard',
          items: [DEFAULT_ITEM]
        }
      ]
    };
  }

  // Already in multi-dashboard format
  if (Array.isArray(raw.dashboards) && raw.dashboards.length > 0) {
    return {
      activeDashboardId: raw.activeDashboardId || raw.dashboards[0].id,
      dashboards: raw.dashboards.map(d => ({
        id: d.id || `dash_${Date.now()}`,
        name: d.name || 'Dashboard',
        icon: d.icon || 'LayoutDashboard',
        items: (d.items || []).map(item => ({
          ...item,
          dbPath: item.dbPath || 'data/userman_active.db'
        }))
      }))
    };
  }

  // Legacy single dashboard array migration
  const legacyItems = Array.isArray(raw.dashboard) ? raw.dashboard : [];
  return {
    activeDashboardId: 'dash_default',
    dashboards: [
      {
        id: 'dash_default',
        name: 'Main Overview',
        icon: 'LayoutDashboard',
        items: legacyItems.length > 0 ? legacyItems : [DEFAULT_ITEM]
      }
    ]
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    const initialConfig = normalizeConfig(null);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initialConfig, null, 2), 'utf-8');
  }
}

export function readConfig() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return normalizeConfig(JSON.parse(raw));
  } catch (err) {
    return normalizeConfig(null);
  }
}

export function saveConfig(configData) {
  ensureDataDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
}

export function getDashboardsData() {
  return readConfig();
}

export function createDashboardTab(name = 'New Dashboard', icon = 'LayoutDashboard') {
  const config = readConfig();
  const newDash = {
    id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    icon: icon || 'LayoutDashboard',
    items: []
  };
  config.dashboards.push(newDash);
  config.activeDashboardId = newDash.id;
  saveConfig(config);
  return { config, newDash };
}

export function renameDashboardTab(dashboardId, name, icon) {
  const config = readConfig();
  const dash = config.dashboards.find(d => d.id === dashboardId);
  if (dash) {
    if (name) dash.name = name.trim();
    if (icon) dash.icon = icon;
    saveConfig(config);
    return { success: true, config };
  }
  return { success: false, error: 'Dashboard not found' };
}

export function deleteDashboardTab(dashboardId) {
  const config = readConfig();
  if (config.dashboards.length <= 1) {
    return { success: false, error: 'Cannot delete the only dashboard.' };
  }
  config.dashboards = config.dashboards.filter(d => d.id !== dashboardId);
  if (config.activeDashboardId === dashboardId) {
    config.activeDashboardId = config.dashboards[0].id;
  }
  saveConfig(config);
  return { success: true, config };
}

export function getDashboardItems(dashboardId) {
  const config = readConfig();
  const targetId = dashboardId || config.activeDashboardId;
  const dash = config.dashboards.find(d => d.id === targetId) || config.dashboards[0];
  return dash ? dash.items : [];
}

export function addDashboardItem(item, dashboardId) {
  const config = readConfig();
  const targetId = dashboardId || config.activeDashboardId;
  const dash = config.dashboards.find(d => d.id === targetId) || config.dashboards[0];

  const newItem = {
    id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: item.name || 'Untitled Widget',
    type: item.type || 'stat_card',
    chartType: item.chartType || 'bar',
    icon: item.icon || 'Activity',
    prefix: item.prefix || '',
    suffix: item.suffix || '',
    subtitle: item.subtitle || '',
    xAxisCol: item.xAxisCol || '',
    yAxisCols: Array.isArray(item.yAxisCols) ? item.yAxisCols : [],
    dualAxis: !!item.dualAxis,
    chartMode: item.chartMode || 'grouped',
    size: item.size || 'half',
    dbPath: item.dbPath || 'data/userman_active.db',
    sql: item.sql || 'SELECT 1;',
    color: item.color || 'cyan',
    createdAt: new Date().toISOString()
  };

  dash.items.push(newItem);
  saveConfig(config);
  return { item: newItem, config };
}

export function updateDashboardItem(id, updatedData, dashboardId) {
  const config = readConfig();
  const targetId = dashboardId || config.activeDashboardId;
  const dash = config.dashboards.find(d => d.id === targetId) || config.dashboards[0];
  if (!dash) return null;

  const idx = dash.items.findIndex(item => item.id === id);
  if (idx === -1) return null;

  dash.items[idx] = {
    ...dash.items[idx],
    name: updatedData.name || dash.items[idx].name,
    type: updatedData.type || dash.items[idx].type,
    chartType: updatedData.chartType || dash.items[idx].chartType,
    icon: updatedData.icon !== undefined ? updatedData.icon : dash.items[idx].icon,
    prefix: updatedData.prefix !== undefined ? updatedData.prefix : dash.items[idx].prefix,
    suffix: updatedData.suffix !== undefined ? updatedData.suffix : dash.items[idx].suffix,
    subtitle: updatedData.subtitle !== undefined ? updatedData.subtitle : dash.items[idx].subtitle,
    xAxisCol: updatedData.xAxisCol !== undefined ? updatedData.xAxisCol : dash.items[idx].xAxisCol,
    yAxisCols: Array.isArray(updatedData.yAxisCols) ? updatedData.yAxisCols : dash.items[idx].yAxisCols,
    dualAxis: updatedData.dualAxis !== undefined ? !!updatedData.dualAxis : dash.items[idx].dualAxis,
    chartMode: updatedData.chartMode || dash.items[idx].chartMode || 'grouped',
    size: updatedData.size || dash.items[idx].size,
    dbPath: updatedData.dbPath || dash.items[idx].dbPath || 'data/userman_active.db',
    sql: updatedData.sql || dash.items[idx].sql,
    color: updatedData.color || dash.items[idx].color,
    updatedAt: new Date().toISOString()
  };

  saveConfig(config);
  return { item: dash.items[idx], config };
}

export function deleteDashboardItem(id, dashboardId) {
  const config = readConfig();
  let found = false;

  for (const dash of config.dashboards) {
    if (!dashboardId || dash.id === dashboardId) {
      const initialLen = dash.items.length;
      dash.items = dash.items.filter(item => item.id !== id);
      if (dash.items.length !== initialLen) {
        found = true;
        break;
      }
    }
  }

  if (found) {
    saveConfig(config);
  }
  return { success: found, config };
}

export function reorderDashboardItems(orderedIds, dashboardId) {
  const config = readConfig();
  const targetId = dashboardId || config.activeDashboardId;
  const dash = config.dashboards.find(d => d.id === targetId) || config.dashboards[0];
  if (!dash || !Array.isArray(orderedIds)) return config;

  const itemMap = new Map(dash.items.map(item => [item.id, item]));
  const reordered = [];

  for (const id of orderedIds) {
    if (itemMap.has(id)) {
      reordered.push(itemMap.get(id));
      itemMap.delete(id);
    }
  }

  for (const remaining of itemMap.values()) {
    reordered.push(remaining);
  }

  dash.items = reordered;
  saveConfig(config);
  return config;
}
