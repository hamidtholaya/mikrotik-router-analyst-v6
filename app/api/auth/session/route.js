import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('mikrotik_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, session: null });
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Don't expose raw password in session GET check
    const safeSession = {
      host: session.host,
      port: session.port,
      user: session.user,
      tls: session.tls,
      identity: session.identity,
      boardName: session.boardName,
      version: session.version,
      uptime: session.uptime,
      connectedAt: session.connectedAt
    };

    return NextResponse.json({ authenticated: true, session: safeSession });
  } catch (error) {
    return NextResponse.json({ authenticated: false, session: null });
  }
}
