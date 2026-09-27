import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'userman_active.db');

/**
 * Automatically decodes SQLite Buffer / BLOB values to UTF-8 strings
 */
function sanitizeRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(row => {
    const cleanRow = {};
    for (const [key, val] of Object.entries(row)) {
      if (Buffer.isBuffer(val)) {
        cleanRow[key] = val.toString('utf-8');
      } else if (val && typeof val === 'object' && val.type === 'Buffer' && Array.isArray(val.data)) {
        cleanRow[key] = Buffer.from(val.data).toString('utf-8');
      } else {
        cleanRow[key] = val;
      }
    }
    return cleanRow;
  });
}

/**
 * Execute raw SQL query directly against target SQLite database file
 * @param {string} sqlQuery SQL statement
 * @param {string} [customDbPath] Relative or absolute path to database file
 */
export async function executeSqlQuery(sqlQuery, customDbPath) {
  if (!sqlQuery || typeof sqlQuery !== 'string') {
    throw new Error('Valid SQL statement string is required.');
  }

  // Resolve target database path (default to data/userman_active.db)
  let targetDbPath = DEFAULT_DB_PATH;
  if (customDbPath && typeof customDbPath === 'string' && customDbPath.trim()) {
    targetDbPath = path.isAbsolute(customDbPath) 
      ? customDbPath 
      : path.join(process.cwd(), customDbPath.trim());
  }

  // Check if database file exists
  if (!fs.existsSync(targetDbPath)) {
    return {
      success: false,
      rows: [],
      columns: [],
      error: `Database file not found at: ${targetDbPath}. Please check database path or reload sqldb.`
    };
  }

  return new Promise((resolve) => {
    const db = new sqlite3.Database(targetDbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        return resolve({
          success: false,
          rows: [],
          columns: [],
          error: `Database Open Error: ${err.message}`
        });
      }
    });

    db.all(sqlQuery.trim(), [], (err, rawRows) => {
      db.close();

      if (err) {
        return resolve({
          success: false,
          rows: [],
          columns: [],
          error: `SQL Syntax/Execution Error: ${err.message}`
        });
      }

      const rows = sanitizeRows(rawRows || []);
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      resolve({
        success: true,
        rows,
        columns,
        rowCount: rows.length,
        executedAt: new Date().toISOString(),
        dbPathUsed: targetDbPath
      });
    });
  });
}
