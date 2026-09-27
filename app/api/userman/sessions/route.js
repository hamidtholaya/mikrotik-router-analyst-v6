import { NextResponse } from 'next/server';
import { executeSqlQuery } from '../../../lib/sqlite-runner';

export const dynamic = 'force-dynamic';

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
  let buf = null;
  if (Buffer.isBuffer(val)) buf = val;
  else if (val && typeof val === 'object' && val.type === 'Buffer' && Array.isArray(val.data)) buf = Buffer.from(val.data);
  else if (typeof val === 'string') buf = Buffer.from(val, 'binary');

  if (buf && buf.length >= 4) {
    return `${buf[0]}.${buf[1]}.${buf[2]}.${buf[3]}`;
  }
  return 'N/A';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page'), 10) || 1;
    const limit = parseInt(searchParams.get('limit'), 10) || 10;
    const status = (searchParams.get('status') || '').trim(); // all, active, closed

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required.' },
        { status: 400 }
      );
    }

    const safeUserId = parseInt(userId, 10);
    if (isNaN(safeUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId parameter.' },
        { status: 400 }
      );
    }

    const whereConditions = [`userId = ${safeUserId}`];
    if (status === 'active') {
      whereConditions.push(`active = 1`);
    } else if (status === 'closed') {
      whereConditions.push(`active = 0`);
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;

    // Count total sessions for user
    const countResult = await executeSqlQuery(`SELECT COUNT(*) as totalSessions FROM session ${whereSql};`);
    const totalRecords = countResult.rows && countResult.rows[0] ? countResult.rows[0].totalSessions : 0;

    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const offset = (currentPage - 1) * limit;

    // Fetch paginated sessions sorted by start time descending (newest first)
    const sessionsQuery = `
      SELECT 
        id, 
        userId, 
        active, 
        fromTime, 
        tillTime, 
        upTime, 
        bytesDownload, 
        bytesUpload, 
        CAST(callingStationId AS TEXT) as mac, 
        ipUser 
      FROM session
      ${whereSql}
      ORDER BY fromTime DESC, id DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const sessionsResult = await executeSqlQuery(sessionsQuery);

    const formattedSessions = (sessionsResult.rows || []).map(s => ({
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

    return NextResponse.json({
      success: true,
      data: formattedSessions,
      pagination: {
        page: currentPage,
        limit,
        totalRecords,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages
      }
    });

  } catch (error) {
    console.error('Sessions API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
