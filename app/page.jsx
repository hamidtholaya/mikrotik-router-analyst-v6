'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const hasSession = typeof document !== 'undefined' && 
      (document.cookie.includes('mikrotik_session=') || localStorage.getItem('mikrotik_session'));
    
    if (hasSession) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading MikroTik Analyst...</p>
    </div>
  );
}
