import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

// Define local storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const ACTIVE_DB_PATH = path.join(DATA_DIR, 'userman_active.db');

// Ensure directories exist
export function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

/**
 * Format Date to YYYY-MM-DD_HH-mm-ss
 */
function getTimestampString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}

/**
 * Connect to MikroTik FTP and locate/download the sqldb file
 */
async function fetchSqlDbFromRouter(config, targetLocalPath) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const ftpPort = parseInt(config.ftpPort, 10) || 21;
  const timeoutMs = 12000;

  try {
    await client.access({
      host: config.host,
      port: ftpPort,
      user: config.user,
      password: config.password || '',
      secure: false,
    });

    // Known relative/absolute paths for User Manager sqldb in RouterOS
    const possiblePaths = [
      '/user-manager/sqldb',
      'user-manager/sqldb',
      '/flash/user-manager/sqldb',
      'flash/user-manager/sqldb',
      'sqldb'
    ];

    let downloaded = false;
    let lastError = null;

    for (const remotePath of possiblePaths) {
      try {
        await client.downloadTo(targetLocalPath, remotePath);
        downloaded = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    // Fallback: If direct path download fails, list root/user-manager dir to locate sqldb
    if (!downloaded) {
      try {
        const list = await client.list('/user-manager');
        const sqldbFile = list.find(item => item.name === 'sqldb');
        if (sqldbFile) {
          await client.downloadTo(targetLocalPath, `/user-manager/${sqldbFile.name}`);
          downloaded = true;
        }
      } catch (err) {
        // ignore list error
      }
    }

    client.close();

    if (!downloaded) {
      throw new Error(
        lastError ? `FTP Download Error: ${lastError.message}` : 'user-manager/sqldb file not found on router.'
      );
    }

    const stats = fs.statSync(targetLocalPath);
    return {
      success: true,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      localPath: targetLocalPath,
      syncedAt: new Date().toISOString()
    };

  } catch (error) {
    client.close();
    console.error('MikroTik FTP Sync Error:', error);
    throw error;
  }
}

/**
 * Downloads user-manager/sqldb and saves it to fixed file data/userman_active.db
 */
export async function downloadActiveSqlDb(config) {
  ensureDirs();
  const result = await fetchSqlDbFromRouter(config, ACTIVE_DB_PATH);
  return {
    ...result,
    fixedFileName: 'userman_active.db'
  };
}

/**
 * Downloads user-manager/sqldb and saves it with formatted timestamp in data/backups/
 */
export async function createTimestampedBackup(config) {
  ensureDirs();
  const timestamp = getTimestampString();
  const backupFileName = `userman_sqldb_${timestamp}.sqldb`;
  const targetBackupPath = path.join(BACKUPS_DIR, backupFileName);

  const result = await fetchSqlDbFromRouter(config, targetBackupPath);
  return {
    ...result,
    backupFileName,
    timestamp
  };
}

/**
 * Reads data/userman_active.db status
 */
export function getActiveDbInfo() {
  ensureDirs();
  if (fs.existsSync(ACTIVE_DB_PATH)) {
    const stats = fs.statSync(ACTIVE_DB_PATH);
    return {
      exists: true,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      lastModified: stats.mtime.toISOString(),
      path: ACTIVE_DB_PATH
    };
  }
  return { exists: false };
}

/**
 * Returns list of all saved timestamped backups
 */
export function listLocalBackups() {
  ensureDirs();
  if (!fs.existsSync(BACKUPS_DIR)) return [];

  const files = fs.readdirSync(BACKUPS_DIR);
  return files
    .filter(f => f.endsWith('.sqldb') || f.endsWith('.umb') || f.endsWith('.backup'))
    .map(filename => {
      const fullPath = path.join(BACKUPS_DIR, filename);
      const stats = fs.statSync(fullPath);
      return {
        filename,
        sizeBytes: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
        createdAt: stats.birthtime.toISOString() || stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
