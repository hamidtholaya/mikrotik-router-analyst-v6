import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createTimestampedBackup, listLocalBackups } from '../../../lib/mikrotik-file-sync';

// List existing local backups
export async function GET() {
  try {
    const backups = listLocalBackups();
    return NextResponse.json({ success: true, backups });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Create new timestamped backup
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
      const pad = (n) => String(n).padStart(2, '0');
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const backupFileName = `userman_sqldb_demo_${timestamp}.sqldb`;

      return NextResponse.json({
        success: true,
        message: `Demo Mode: Created backup ${backupFileName}`,
        backup: {
          backupFileName,
          timestamp,
          sizeFormatted: '1.2 MB'
        }
      });
    }

    const backupResult = await createTimestampedBackup({
      host: session.host,
      user: session.user,
      password: session.password || '',
      ftpPort: 21
    });

    const backups = listLocalBackups();

    return NextResponse.json({
      success: true,
      message: `Created timestamped backup: ${backupResult.backupFileName}`,
      backup: backupResult,
      backups
    });

  } catch (error) {
    console.error('Create Backup Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create timestamped backup.' },
      { status: 500 }
    );
  }
}
