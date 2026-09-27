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
  Moon,
  Menu,
  X,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { apiFetch } from '../lib/apiClient';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [usersMenuOpen, setUsersMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load stored theme or default to dark
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
    checkSession();
  }, [pathname]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const checkSession = async () => {
    try {
      const res = await apiFetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated) {
        setSession(data.session);
        localStorage.setItem('mikrotik_session', JSON.stringify(data.session));
      } else {
        const stored = localStorage.getItem('mikrotik_session');
        if (stored) {
          try {
            setSession(JSON.parse(stored));
          } catch (e) {
            setSession(null);
          }
        } else {
          setSession(null);
        }
      }
    } catch (err) {
      const stored = localStorage.getItem('mikrotik_session');
      if (stored) {
        try {
          setSession(JSON.parse(stored));
        } catch (e) {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReloadDatabase = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await apiFetch('/api/userman/sync', { method: 'POST' });
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
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('mikrotik_session');
      setSession(null);
      setMobileDrawerOpen(false);
      router.push('/login');
      router.refresh();
    }
  };

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      {/* Top Header Navbar */}
      <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand / Logo */}
          <Link href={session ? '/dashboard' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
            }}>
              <Router style={{ width: '20px', height: '20px', color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                MikroTik Analyst
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: session ? 'var(--accent-emerald)' : 'var(--accent-rose)', display: 'inline-block' }}></span>
                {session ? `${session.host}` : 'Disconnected'}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-only" style={{ alignItems: 'center', gap: '6px' }}>
            {!session && (
              <Link 
                href="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
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
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
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

            {/* Users Nav with Subnav */}
            <div style={{ position: 'relative' }}>
              <Link
                href="/users"
                onMouseEnter={() => setUsersMenuOpen(true)}
                onMouseLeave={() => setUsersMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
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
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.88rem',
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

          {/* Desktop Actions */}
          <div className="desktop-only" style={{ alignItems: 'center', gap: '10px' }}>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun style={{ width: '15px', height: '15px', color: 'var(--accent-amber)' }} />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon style={{ width: '15px', height: '15px', color: 'var(--accent-purple)' }} />
                  <span>Dark</span>
                </>
              )}
            </button>

            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleReloadDatabase}
                  disabled={syncing}
                  className="btn btn-outline-cyan"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  title="Reload userman_active.db from router"
                >
                  <RefreshCw style={{ width: '14px', height: '14px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing ? 'Reloading...' : syncMsg || 'Reload sqldb'}
                </button>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    {session.user}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <Database style={{ width: '11px', height: '11px' }} />
                    {session.dbSynced ? 'sqldb Active' : 'Online'}
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="btn btn-danger"
                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                  title="Logout"
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                <LogIn style={{ width: '14px', height: '14px' }} />
                Connect
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Theme + Hamburger Button */}
          <div className="mobile-only" style={{ alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'rgba(125, 125, 125, 0.1)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun style={{ width: '18px', height: '18px', color: 'var(--accent-amber)' }} /> : <Moon style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />}
            </button>

            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Open Navigation Menu"
            >
              {mobileDrawerOpen ? <X style={{ width: '22px', height: '22px' }} /> : <Menu style={{ width: '22px', height: '22px' }} />}
            </button>
          </div>

        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 90,
          display: 'flex',
          justifyContent: 'flex-start'
        }}
        onClick={() => setMobileDrawerOpen(false)}
        >
          <div 
            style={{
              width: '280px',
              height: '100%',
              background: 'var(--bg-glass)',
              borderRight: '1px solid var(--border-color)',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status card */}
            <div className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Router Status</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                {session ? session.host : 'Not Connected'}
              </div>
              <div style={{ fontSize: '0.75rem', color: session ? 'var(--accent-emerald)' : 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: session ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}></span>
                {session ? `Logged in as ${session.user}` : 'Requires Login'}
              </div>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link 
                href="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: isActive('/dashboard') ? 'var(--accent-cyan)' : 'var(--text-main)',
                  background: isActive('/dashboard') ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  border: isActive('/dashboard') ? '1px solid var(--border-active)' : '1px solid transparent'
                }}
              >
                <LayoutDashboard style={{ width: '18px', height: '18px', color: 'var(--accent-cyan)' }} />
                Dashboard
              </Link>

              <Link 
                href="/users"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: isActive('/users') ? 'var(--accent-cyan)' : 'var(--text-main)',
                  background: isActive('/users') ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  border: isActive('/users') ? '1px solid var(--border-active)' : '1px solid transparent'
                }}
              >
                <Users style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
                Users Manager
              </Link>

              <Link 
                href="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: isActive('/settings') ? 'var(--accent-cyan)' : 'var(--text-main)',
                  background: isActive('/settings') ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  border: isActive('/settings') ? '1px solid var(--border-active)' : '1px solid transparent'
                }}
              >
                <Settings style={{ width: '18px', height: '18px', color: 'var(--accent-amber)' }} />
                Settings & Database
              </Link>
            </div>

            {/* Action buttons inside drawer */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {session && (
                <button
                  onClick={handleReloadDatabase}
                  disabled={syncing}
                  className="btn btn-outline-cyan"
                  style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
                >
                  <RefreshCw style={{ width: '15px', height: '15px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing ? 'Reloading sqldb...' : syncMsg || 'Reload Database'}
                </button>
              )}

              {session ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
                >
                  <LogOut style={{ width: '16px', height: '16px' }} />
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
                >
                  <LogIn style={{ width: '16px', height: '16px' }} />
                  Connect Router
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Action Bar (One-Thumb Quick Navigation) */}
      <nav 
        className="mobile-only" 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 80,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        <Link 
          href="/dashboard"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: isActive('/dashboard') ? 'var(--accent-cyan)' : 'var(--text-dim)',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}
        >
          <LayoutDashboard style={{ width: '20px', height: '20px' }} />
          Dashboard
        </Link>

        <Link 
          href="/users"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: isActive('/users') ? 'var(--accent-cyan)' : 'var(--text-dim)',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}
        >
          <Users style={{ width: '20px', height: '20px' }} />
          Users
        </Link>

        <Link 
          href="/settings"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: isActive('/settings') ? 'var(--accent-cyan)' : 'var(--text-dim)',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}
        >
          <Settings style={{ width: '20px', height: '20px' }} />
          Settings
        </Link>

        <button 
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: mobileDrawerOpen ? 'var(--accent-cyan)' : 'var(--text-dim)',
            fontSize: '0.7rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <SlidersHorizontal style={{ width: '20px', height: '20px' }} />
          Menu
        </button>
      </nav>
    </>
  );
}
