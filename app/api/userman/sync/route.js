import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { downloadActiveSqlDb, getActiveDbInfo } from '../../../lib/mikrotik-file-sync';

export async function POST() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('mikrotik_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, error: 'No active router session. Please login first.' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.isDemo) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode active: Simulated database reloaded successfully.',
        activeDb: {
          exists: true,
          sizeFormatted: '1.2 MB',
          lastModified: new Date().toISOString(),
          fixedFileName: 'userman_active.db'
        }
      });
    }

    const syncResult = await downloadActiveSqlDb({
      host: session.host,
      user: session.user,
      password: session.password || '',
      ftpPort: 21
    });

    const activeDbInfo = getActiveDbInfo();

    return NextResponse.json({
      success: true,
      message: 'Successfully reloaded user-manager/sqldb from router and updated userman_active.db',
      syncResult,
      activeDb: activeDbInfo
    });

  } catch (error) {
    console.error('Manual DB Sync Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reload database from router.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const activeDbInfo = getActiveDbInfo();
    return NextResponse.json({ success: true, activeDb: activeDbInfo });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
