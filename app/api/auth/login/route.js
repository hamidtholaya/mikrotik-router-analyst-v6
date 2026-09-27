import { NextResponse } from 'next/server';
import { RouterOSAPI } from 'node-routeros';
import { cookies } from 'next/headers';
import { downloadActiveSqlDb } from '../../../lib/mikrotik-file-sync';

export async function POST(request) {
  try {
    const body = await request.json();
    const { host, port, user, password, tls, demo } = body;

    if (demo) {
      const sessionData = {
        host: host || 'demo.mikrotik.com',
        port: 8728,
        user: user || 'demo-admin',
        password: '',
        tls: false,
        identity: 'MikroTik-Demo-CCR1036',
        boardName: 'CCR1036-12G-4S',
        version: '7.12 (stable)',
        uptime: '14d 06:22:15',
        connectedAt: new Date().toISOString(),
        dbSynced: true,
        dbSize: '1.2 MB',
        isDemo: true
      };

      const cookieStore = cookies();
      cookieStore.set('mikrotik_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully connected in Demo Mode',
        info: sessionData
      });
    }

    if (!host || !user) {
      return NextResponse.json(
        { success: false, error: 'Host IP and Username are required.' },
        { status: 400 }
      );
    }

    const apiPort = parseInt(port, 10) || (tls ? 8729 : 8728);

    // Initialize node-routeros connection
    const conn = new RouterOSAPI({
      host: host.trim(),
      user: user.trim(),
      password: password || '',
      port: apiPort,
      tls: !!tls,
      timeout: 8,
    });

    let identityRes = null;
    let resourceRes = null;

    try {
      await conn.connect();
      identityRes = await conn.write('/system/identity/print');
      resourceRes = await conn.write('/system/resource/print');
      await conn.close();
    } catch (connError) {
      console.error('RouterOS connection error:', connError);
      return NextResponse.json(
        { 
          success: false, 
          error: connError.message || 'Failed to connect to MikroTik router.',
          details: connError.toString()
        },
        { status: 401 }
      );
    }

    const identity = identityRes && identityRes[0] ? identityRes[0].name : 'MikroTik Router';
    const boardName = resourceRes && resourceRes[0] ? resourceRes[0]['board-name'] : 'Unknown Device';
    const version = resourceRes && resourceRes[0] ? resourceRes[0].version : 'Unknown OS';
    const uptime = resourceRes && resourceRes[0] ? resourceRes[0].uptime : 'N/A';

    // Auto-sync user-manager/sqldb to fixed file data/userman_active.db via FTP
    let dbSynced = false;
    let dbSize = null;
    let dbSyncWarning = null;

    try {
      const syncResult = await downloadActiveSqlDb({
        host: host.trim(),
        user: user.trim(),
        password: password || '',
        ftpPort: 21
      });
      dbSynced = true;
      dbSize = syncResult.sizeFormatted;
    } catch (ftpError) {
      console.warn('FTP Auto-sync warning:', ftpError.message);
      dbSyncWarning = ftpError.message;
    }

    // Store session cookie
    const sessionData = {
      host: host.trim(),
      port: apiPort,
      user: user.trim(),
      password: password || '',
      tls: !!tls,
      identity,
      boardName,
      version,
      uptime,
      connectedAt: new Date().toISOString(),
      dbSynced,
      dbSize,
      dbSyncWarning,
      isDemo: false
    };

    const cookieStore = cookies();
    cookieStore.set('mikrotik_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${identity} (${boardName})`,
      info: {
        identity,
        boardName,
        version,
        uptime,
        host,
        port: apiPort,
        dbSynced,
        dbSize,
        dbSyncWarning
      }
    });

  } catch (error) {
    console.error('Login Handler Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
