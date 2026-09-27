'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Router, 
  Shield, 
  KeyRound, 
  User, 
  Globe, 
  Server, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock,
  Activity,
  ArrowRight,
  Sparkles,
  Save,
  Smartphone,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiFetch, isNativeMobile, getApiBaseUrl, setApiBaseUrl } from '../lib/apiClient';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    host: '',
    port: '8728',
    user: '',
    password: '',
    tls: false,
    demo: false,
    rememberMe: false
  });

  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved credentials (including password) if rememberMe was previously checked
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mikrotik_saved_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          host: parsed.host || '',
          port: parsed.port || '8728',
          user: parsed.user || '',
          password: parsed.password || '',
          tls: !!parsed.tls,
          rememberMe: true
        }));
      }
    } catch (e) {
      // Ignore parse error
    }
  }, []);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    setErrorMsg(null);

    // If Demo Mode is enabled, simulate instantaneous connection client-side
    if (formData.demo) {
      setTimeout(() => {
        setTestResult({
          success: true,
          latency: '8ms',
          routerInfo: {
            identity: 'MikroTik-CCR1036 (Demo)',
            model: 'CCR1036-12G-4S',
            version: '6.48.7 (stable)',
            cpuLoad: '4%',
            uptime: '28d 14:10:02',
            freeMemory: '3840 MB',
            time: new Date().toLocaleString()
          }
        });
        setTesting(false);
      }, 350);
      return;
    }

    try {
      const res = await apiFetch('/api/mikrotik/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setTestResult(data);
      } else {
        setErrorMsg(data.error || 'Connection failed.');
      }
    } catch (err) {
      setErrorMsg(`Failed to reach router at ${formData.host || 'specified address'}. Ensure router is reachable and API service (port ${formData.port || '8728'}) is enabled.`);
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnecting(true);
    setErrorMsg(null);

    // Immediate Demo Mode bypass
    if (formData.demo) {
      localStorage.setItem('mikrotik_session', JSON.stringify({
        user: 'demo-admin',
        host: '10.20.0.1 (Demo)',
        isDemo: true,
        timestamp: Date.now()
      }));
      router.push('/dashboard');
      router.refresh();
      return;
    }

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        if (formData.rememberMe) {
          localStorage.setItem('mikrotik_saved_creds', JSON.stringify({
            host: formData.host,
            port: formData.port,
            user: formData.user,
            password: formData.password || '',
            tls: formData.tls
          }));
        } else {
          localStorage.removeItem('mikrotik_saved_creds');
        }

        // Store session for client and native mobile app
        localStorage.setItem('mikrotik_session', JSON.stringify(data.session || {
          user: formData.user,
          host: formData.host,
          timestamp: Date.now()
        }));

        router.push('/dashboard');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Failed to authenticate with router.');
      }
    } catch (err) {
      setErrorMsg(`Network error connecting to router at ${formData.host || 'specified address'}. Check Wi-Fi or router connection.`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto 0 auto' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          color: 'var(--accent-cyan)',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          <Router style={{ width: '16px', height: '16px' }} />
          RouterOS API Integration
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '10px' }}>
          Connect to your MikroTik Router
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto' }}>
          Enter your RouterOS device API credentials to initiate connection using Node RouterOS API.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* Connection Form Card */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px 20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <Shield style={{ color: 'var(--accent-cyan)', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)' }}>Router Credentials</h2>
          </div>

          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Host & Port grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">
                  <Globe style={{ width: '14px', height: '14px' }} />
                  Router IP / Host
                </label>
                <input 
                  type="text" 
                  name="host" 
                  className="input-field" 
                  value={formData.host}
                  onChange={handleChange}
                  placeholder="192.168.88.1"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <Server style={{ width: '14px', height: '14px' }} />
                  API Port
                </label>
                <input 
                  type="number" 
                  name="port" 
                  className="input-field" 
                  value={formData.port}
                  onChange={handleChange}
                  placeholder="8728"
                  required
                />
              </div>
            </div>

            {/* User field */}
            <div className="input-group">
              <label className="input-label">
                <User style={{ width: '14px', height: '14px' }} />
                Username
              </label>
              <input 
                type="text" 
                name="user" 
                className="input-field" 
                value={formData.user}
                onChange={handleChange}
                placeholder="admin"
                required
              />
            </div>

            {/* Password field */}
            <div className="input-group">
              <label className="input-label">
                <KeyRound style={{ width: '14px', height: '14px' }} />
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  className="input-field" 
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ width: '100%', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px'
                  }}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '16px', height: '16px', color: 'var(--accent-cyan)' }} />
                  ) : (
                    <Eye style={{ width: '16px', height: '16px' }} />
                  )}
                </button>
              </div>
            </div>

            {/* SSL / TLS Option & Demo Mode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="tls" 
                  name="tls" 
                  checked={formData.tls}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
                <label htmlFor="tls" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock style={{ width: '14px', height: '14px', color: formData.tls ? 'var(--accent-cyan)' : 'var(--text-dim)' }} />
                  Enable SSL / TLS Encrypted API (Port 8729)
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  name="rememberMe" 
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '0.88rem', color: formData.rememberMe ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: formData.rememberMe ? '600' : '400' }}>
                  <Save style={{ width: '14px', height: '14px', color: formData.rememberMe ? 'var(--accent-cyan)' : 'var(--text-dim)' }} />
                  Remember credentials on this device
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="demo" 
                  name="demo" 
                  checked={formData.demo}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                />
                <label htmlFor="demo" style={{ fontSize: '0.88rem', color: formData.demo ? 'var(--accent-purple)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: formData.demo ? '600' : '400' }}>
                  <Sparkles style={{ width: '14px', height: '14px', color: 'var(--accent-amber)' }} />
                  Demo Mode (Test UI without physical router)
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button"
                onClick={handleTestConnection}
                disabled={testing || connecting}
                className="btn btn-outline-cyan"
                style={{ flex: 1 }}
              >
                {testing ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap style={{ width: '16px', height: '16px' }} />
                    Test Connection
                  </>
                )}
              </button>

              <button 
                type="submit"
                disabled={connecting || testing}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {connecting ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Router
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* Status / Output Display Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Default Info box */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ color: 'var(--accent-cyan)', width: '18px', height: '18px' }} />
              API Connection Status
            </h3>

            {errorMsg && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                color: '#fca5a5',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <AlertCircle style={{ width: '20px', height: '20px', shrink: 0, color: 'var(--accent-rose)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Connection Failed</div>
                  <div>{errorMsg}</div>
                </div>
              </div>
            )}

            {testResult && testResult.success && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  color: '#6ee7b7',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 style={{ width: '20px', height: '20px', color: 'var(--accent-emerald)' }} />
                  <div>
                    <span style={{ fontWeight: '600' }}>Ping OK!</span> Connected in {testResult.latency}
                  </div>
                </div>

                {/* Router specs grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Identity</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>{testResult.routerInfo.identity}</div>
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Board Model</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>{testResult.routerInfo.model}</div>
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>RouterOS Version</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>{testResult.routerInfo.version}</div>
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Uptime</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{testResult.routerInfo.uptime}</div>
                  </div>
                </div>
              </div>
            )}

            {!testResult && !errorMsg && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <Server style={{ width: '36px', height: '36px', strokeWidth: 1.5, opacity: 0.4, margin: '0 auto 10px auto' }} />
                Click <strong>"Test Connection"</strong> to test API reachability with <code style={{ color: 'var(--accent-cyan)' }}>node-routeros</code> before logging in.
              </div>
            )}

          </div>

          {/* Quick Tips Panel */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>MikroTik API Setup Requirements:</div>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Ensure API service is enabled in RouterOS (WinBox: <code>IP &gt; Services &gt; api</code>).</li>
              <li>Default plain API port is <strong>8728</strong>. SSL API port is <strong>8729</strong>.</li>
              <li>User account must have <code>read</code> and <code>api</code> permissions.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
