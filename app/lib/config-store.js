import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'configs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    const initialConfig = {
      dashboard: [
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
      ]
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initialConfig, null, 2), 'utf-8');
  }
}

export function readConfig() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { dashboard: [] };
  }
}

export function saveConfig(configData) {
  ensureDataDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
}

export function getDashboardItems() {
  const config = readConfig();
  return (config.dashboard || []).map(item => ({
    ...item,
    dbPath: item.dbPath || 'data/userman_active.db'
  }));
}

export function addDashboardItem(item) {
  const config = readConfig();
  if (!config.dashboard) config.dashboard = [];
  
  const newItem = {
    id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: item.name || 'Untitled Widget',
    type: item.type || 'stat_card', // stat_card, table, chart
    chartType: item.chartType || 'bar', // bar, line, pie, doughnut
    xAxisCol: item.xAxisCol || '',
    yAxisCols: Array.isArray(item.yAxisCols) ? item.yAxisCols : [],
    dualAxis: !!item.dualAxis,
    chartMode: item.chartMode || 'grouped', // grouped, stacked
    size: item.size || 'half', // full, half, third
    dbPath: item.dbPath || 'data/userman_active.db',
    sql: item.sql || 'SELECT 1;',
    color: item.color || 'cyan',
    createdAt: new Date().toISOString()
  };

  config.dashboard.push(newItem);
  saveConfig(config);
  return newItem;
}

export function updateDashboardItem(id, updatedData) {
  const config = readConfig();
  if (!config.dashboard) return null;

  const idx = config.dashboard.findIndex(item => item.id === id);
  if (idx === -1) return null;

  config.dashboard[idx] = {
    ...config.dashboard[idx],
    name: updatedData.name || config.dashboard[idx].name,
    type: updatedData.type || config.dashboard[idx].type,
    chartType: updatedData.chartType || config.dashboard[idx].chartType,
    xAxisCol: updatedData.xAxisCol !== undefined ? updatedData.xAxisCol : config.dashboard[idx].xAxisCol,
    yAxisCols: Array.isArray(updatedData.yAxisCols) ? updatedData.yAxisCols : config.dashboard[idx].yAxisCols,
    dualAxis: updatedData.dualAxis !== undefined ? !!updatedData.dualAxis : config.dashboard[idx].dualAxis,
    chartMode: updatedData.chartMode || config.dashboard[idx].chartMode || 'grouped',
    size: updatedData.size || config.dashboard[idx].size,
    dbPath: updatedData.dbPath || config.dashboard[idx].dbPath || 'data/userman_active.db',
    sql: updatedData.sql || config.dashboard[idx].sql,
    color: updatedData.color || config.dashboard[idx].color,
    updatedAt: new Date().toISOString()
  };

  saveConfig(config);
  return config.dashboard[idx];
}

export function deleteDashboardItem(id) {
  const config = readConfig();
  if (!config.dashboard) return false;
  
  const initialLength = config.dashboard.length;
  config.dashboard = config.dashboard.filter(item => item.id !== id);
  
  if (config.dashboard.length !== initialLength) {
    saveConfig(config);
    return true;
  }
  return false;
}

export function reorderDashboardItems(orderedIds) {
  const config = readConfig();
  if (!config.dashboard || !Array.isArray(orderedIds)) return getDashboardItems();

  const itemMap = new Map(config.dashboard.map(item => [item.id, item]));
  const reordered = [];

  for (const id of orderedIds) {
    if (itemMap.has(id)) {
      reordered.push(itemMap.get(id));
      itemMap.delete(id);
    }
  }

  // Append any remaining items that were not specified
  for (const item of itemMap.values()) {
    reordered.push(item);
  }

  config.dashboard = reordered;
  saveConfig(config);
  return getDashboardItems();
}
