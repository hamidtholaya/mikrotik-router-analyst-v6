'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Router, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogIn, 
  LogOut, 
  ChevronDown,
  RefreshCw,
  Database,
  Sun,
  Moon
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [usersMenuOpen, setUsersMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load stored theme or default to dark
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
    checkSession();
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated) {
        setSession(data.session);
      } else {
        setSession(null);
      }
    } catch (err) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadDatabase = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/userman/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMsg('Synced OK');
        setTimeout(() => setSyncMsg(null), 3000);
      } else {
        setSyncMsg('Sync Failed');
        setTimeout(() => setSyncMsg(null), 3000);
      }
    } catch (err) {
      setSyncMsg('Error');
      setTimeout(() => setSyncMsg(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand / Logo */}
        <Link href={session ? '/dashboard' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
          }}>
            <Router style={{ width: '22px', height: '22px', color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              MikroTik Manager
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: session ? 'var(--accent-emerald)' : 'var(--accent-rose)', display: 'inline-block' }}></span>
              {session ? `Connected: ${session.host}` : 'Disconnected'}
            </div>
          </div>
        </Link>

        {/* Main Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!session && (
            <Link 
              href="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive('/login') ? 'var(--accent-cyan)' : 'var(--text-muted)',
                background: isActive('/login') ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                border: isActive('/login') ? '1px solid var(--border-active)' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <LogIn style={{ width: '16px', height: '16px' }} />
              Login
            </Link>
          )}

          <Link 
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: isActive('/dashboard') ? 'var(--accent-cyan)' : 'var(--text-muted)',
              background: isActive('/dashboard') ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              border: isActive('/dashboard') ? '1px solid var(--border-active)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <LayoutDashboard style={{ width: '16px', height: '16px' }} />
            Dashboard
          </Link>

          {/* Users Nav with Subnav Stub */}
          <div style={{ position: 'relative' }}>
            <Link
              href="/users"
              onMouseEnter={() => setUsersMenuOpen(true)}
              onMouseLeave={() => setUsersMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive('/users') ? 'var(--accent-cyan)' : 'var(--text-muted)',
                background: isActive('/users') ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                border: isActive('/users') ? '1px solid var(--border-active)' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <Users style={{ width: '16px', height: '16px' }} />
              Users
              <ChevronDown style={{ width: '14px', height: '14px', opacity: 0.6 }} />
            </Link>

            {/* Subnav preview menu */}
            {usersMenuOpen && (
              <div 
                onMouseEnter={() => setUsersMenuOpen(true)}
                onMouseLeave={() => setUsersMenuOpen(false)}
                className="glass-panel" 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  width: '210px',
                  borderRadius: '10px',
                  padding: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  zIndex: 100
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  User Manager Submodules
                </div>
                <div style={{ padding: '6px 10px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Hotspot Users
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Soon</span>
                </div>
                <div style={{ padding: '6px 10px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  PPPoE Secrets
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Soon</span>
                </div>
                <div style={{ padding: '6px 10px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  sqldb Table Reader
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Ready</span>
                </div>
              </div>
            )}
          </div>

          <Link 
            href="/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: isActive('/settings') ? 'var(--accent-cyan)' : 'var(--text-muted)',
              background: isActive('/settings') ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              border: isActive('/settings') ? '1px solid var(--border-active)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings style={{ width: '16px', height: '16px' }} />
            Settings
          </Link>
        </nav>

        {/* Theme Toggle & User / Reload DB / Logout Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Light/Dark Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? (
              <>
                <Sun style={{ width: '16px', height: '16px', color: 'var(--accent-amber)' }} />
                <span style={{ fontSize: '0.8rem' }}>Light</span>
              </>
            ) : (
              <>
                <Moon style={{ width: '16px', height: '16px', color: 'var(--accent-purple)' }} />
                <span style={{ fontSize: '0.8rem' }}>Dark</span>
              </>
            )}
          </button>

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              {/* Reload / Sync sqldb Button */}
              <button
                onClick={handleReloadDatabase}
                disabled={syncing}
                className="btn btn-outline-cyan"
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                title="Reload and replace userman_active.db from router"
              >
                <RefreshCw style={{ width: '14px', height: '14px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Reloading...' : syncMsg || 'Reload sqldb'}
              </button>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  {session.user}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  <Database style={{ width: '12px', height: '12px' }} />
                  {session.dbSynced ? 'sqldb Active' : 'Online'}
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                title="Logout from MikroTik Router"
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <LogIn style={{ width: '15px', height: '15px' }} />
              Connect Router
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
