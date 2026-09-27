import { NextResponse } from 'next/server';
import { RouterOSAPI } from 'node-routeros';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { host, port, user, password, tls, demo } = body;

    // Handle mock demo mode for testing UI without physical router
    if (demo) {
      return NextResponse.json({
        success: true,
        latency: '12ms',
        routerInfo: {
          identity: 'MikroTik-Demo-CCR1036',
          model: 'CCR1036-12G-4S',
          version: '7.12 (stable)',
          cpuLoad: '4%',
          uptime: '14d 06:22:15',
          freeMemory: '3840 MB',
          time: '2026-08-14 19:50:00'
        }
      });
    }

    if (!host || !user) {
      return NextResponse.json(
        { success: false, error: 'Host IP and Username are required.' },
        { status: 400 }
      );
    }

    const apiPort = parseInt(port, 10) || (tls ? 8729 : 8728);

    const conn = new RouterOSAPI({
      host: host.trim(),
      user: user.trim(),
      password: password || '',
      port: apiPort,
      tls: !!tls,
      timeout: 6,
    });

    await conn.connect();

    // Fetch identity & resources
    const identityRes = await conn.write('/system/identity/print');
    const resourceRes = await conn.write('/system/resource/print');
    const clockRes = await conn.write('/system/clock/print');

    await conn.close();
    const latency = Date.now() - startTime;

    const identity = identityRes && identityRes[0] ? identityRes[0].name : 'RouterOS Device';
    const resource = resourceRes && resourceRes[0] ? resourceRes[0] : {};
    const clock = clockRes && clockRes[0] ? clockRes[0] : {};

    return NextResponse.json({
      success: true,
      latency: `${latency}ms`,
      routerInfo: {
        identity,
        model: resource['board-name'] || resource['architecture-name'] || 'MikroTik',
        version: resource.version || 'Unknown',
        cpuLoad: resource['cpu-load'] ? `${resource['cpu-load']}%` : 'N/A',
        uptime: resource.uptime || 'N/A',
        freeMemory: resource['free-memory'] ? `${Math.round(resource['free-memory'] / 1024 / 1024)} MB` : 'N/A',
        time: clock.time ? `${clock.date} ${clock.time}` : 'N/A'
      }
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('Test Connection Error:', error);
    return NextResponse.json(
      {
        success: false,
        latency: `${latency}ms`,
        error: error.message || 'Connection failed',
        details: error.toString()
      },
      { status: 400 }
    );
  }
}
