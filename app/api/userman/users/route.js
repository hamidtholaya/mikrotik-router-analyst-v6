import { NextResponse } from 'next/server';
import { executeSqlQuery } from '../../../lib/sqlite-runner';

export const dynamic = 'force-dynamic';

/**
 * Format bytes into human-readable size (e.g. 1.5 GB)
 */
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime seconds into human-readable duration (e.g. 2d 05h 12m)
 */
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page'), 10) || 1;
    const limit = parseInt(searchParams.get('limit'), 10) || 25;
    const search = (searchParams.get('search') || '').trim();
    const profile = (searchParams.get('profile') || '').trim();
    const status = (searchParams.get('status') || '').trim(); // all, active, disabled
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortDir = (searchParams.get('sortDir') || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Map column names for safe ordering
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

    // Build WHERE clause
    const whereConditions = [];

    if (search) {
      const escaped = search.replace(/'/g, "''");
      whereConditions.push(`(
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
      whereConditions.push(`CAST(actualProfileName AS TEXT) = '${escapedProfile}'`);
    }

    if (status === 'active') {
      whereConditions.push(`disabled = 0`);
    } else if (status === 'disabled') {
      whereConditions.push(`disabled = 1`);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Fetch distinct profiles for filter dropdown
    const profilesResult = await executeSqlQuery(
      "SELECT DISTINCT CAST(actualProfileName AS TEXT) as profileName FROM user WHERE actualProfileName IS NOT NULL ORDER BY profileName ASC;"
    );
    const profilesList = (profilesResult.rows || [])
      .map(r => r.profileName)
      .filter(p => p && p.trim() !== '');

    // Fetch overall stats
    const statsResult = await executeSqlQuery(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN disabled = 0 THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN disabled = 1 THEN 1 ELSE 0 END) as disabledUsers,
        SUM(downloadUsed) as totalDownload,
        SUM(uploadUsed) as totalUpload
      FROM user;
    `);

    const stats = statsResult.rows && statsResult.rows[0] ? statsResult.rows[0] : {
      totalUsers: 0,
      activeUsers: 0,
      disabledUsers: 0,
      totalDownload: 0,
      totalUpload: 0
    };

    // Count filtered rows
    const countResult = await executeSqlQuery(`SELECT COUNT(*) as filteredCount FROM user ${whereSql};`);
    const totalRecords = countResult.rows && countResult.rows[0] ? countResult.rows[0].filteredCount : 0;

    // Calculate pagination offsets
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const offset = (currentPage - 1) * limit;

    // Select query
    const usersQuery = `
      SELECT 
        id, 
        custId, 
        CAST(userName AS TEXT) as userName, 
        CAST(password AS TEXT) as password, 
        disabled, 
        CAST(firstName AS TEXT) as firstName, 
        CAST(lastName AS TEXT) as lastName, 
        CAST(phone AS TEXT) as phone, 
        CAST(email AS TEXT) as email, 
        CAST(descr AS TEXT) as descr, 
        downloadUsed, 
        uploadUsed, 
        uptimeUsed, 
        CAST(actualProfileName AS TEXT) as actualProfileName, 
        profileTillTime, 
        profileTimeLeft,
        lastSeenAt,
        CAST(lastIp AS TEXT) as lastIp,
        CAST(lastMAC AS TEXT) as lastMAC
      FROM user
      ${whereSql}
      ORDER BY ${safeSortCol} ${sortDir}
      LIMIT ${limit} OFFSET ${offset};
    `;

    const usersResult = await executeSqlQuery(usersQuery);

    // Format output fields
    const formattedUsers = (usersResult.rows || []).map(u => ({
      ...u,
      downloadFormatted: formatBytes(u.downloadUsed),
      uploadFormatted: formatBytes(u.uploadUsed),
      totalUsedFormatted: formatBytes((u.downloadUsed || 0) + (u.uploadUsed || 0)),
      uptimeFormatted: formatUptime(u.uptimeUsed),
      statusLabel: u.disabled === 1 ? 'Disabled' : 'Active',
      statusColor: u.disabled === 1 ? 'rose' : 'emerald'
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: currentPage,
        limit,
        totalRecords,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages
      },
      stats: {
        totalUsers: stats.totalUsers || 0,
        activeUsers: stats.activeUsers || 0,
        disabledUsers: stats.disabledUsers || 0,
        totalDownloadFormatted: formatBytes(stats.totalDownload),
        totalUploadFormatted: formatBytes(stats.totalUpload),
        totalTrafficFormatted: formatBytes((stats.totalDownload || 0) + (stats.totalUpload || 0))
      },
      profiles: profilesList
    });

  } catch (error) {
    console.error('Users API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
