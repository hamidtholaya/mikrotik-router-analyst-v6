'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Table as TableIcon, 
  BarChart3, 
  Activity, 
  Plus, 
  Edit3, 
  Database,
  Layers,
  BarChart2,
  Users,
  Wifi,
  Download,
  Upload,
  DollarSign,
  CreditCard,
  ShieldCheck,
  HardDrive,
  Cpu,
  Clock,
  Radio,
  Zap,
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

const AVAILABLE_ICONS = [
  { name: 'Activity', icon: Activity },
  { name: 'Users', icon: Users },
  { name: 'Wifi', icon: Wifi },
  { name: 'Download', icon: Download },
  { name: 'Upload', icon: Upload },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'HardDrive', icon: HardDrive },
  { name: 'Cpu', icon: Cpu },
  { name: 'Clock', icon: Clock },
  { name: 'Radio', icon: Radio },
  { name: 'Layers', icon: Layers },
  { name: 'Zap', icon: Zap },
  { name: 'Database', icon: Database }
];

const CALM_COLORS = [
  { key: 'slate', label: 'Slate Gray (Calm)', border: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
  { key: 'sage', label: 'Sage Green (Calm)', border: '#059669', bg: 'rgba(16, 185, 129, 0.15)' },
  { key: 'teal', label: 'Ocean Teal (Calm)', border: '#0f766e', bg: 'rgba(20, 184, 166, 0.15)' },
  { key: 'indigo', label: 'Muted Indigo (Calm)', border: '#4f46e5', bg: 'rgba(99, 102, 241, 0.15)' },
  { key: 'sand', label: 'Warm Sand (Calm)', border: '#b45309', bg: 'rgba(217, 119, 6, 0.15)' },
  { key: 'lavender', label: 'Soft Lavender (Calm)', border: '#7c3aed', bg: 'rgba(139, 92, 246, 0.15)' },
  { key: 'dusty_rose', label: 'Dusty Rose (Calm)', border: '#be123c', bg: 'rgba(244, 63, 94, 0.15)' }
];

const VIBRANT_COLORS = [
  { key: 'cyan', label: 'Cyan', border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)' },
  { key: 'emerald', label: 'Emerald', border: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
  { key: 'purple', label: 'Purple', border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' },
  { key: 'amber', label: 'Amber', border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
  { key: 'rose', label: 'Rose', border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.2)' },
  { key: 'blue', label: 'Blue', border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' }
];

const AVAILABLE_COLORS = [...CALM_COLORS, ...VIBRANT_COLORS];

const QUICK_TEMPLATES = [
  {
    name: 'Total Users',
    type: 'stat_card',
    icon: 'Users',
    color: 'cyan',
    suffix: 'Users',
    subtitle: 'Total registered user accounts',
    sql: 'SELECT COUNT(*) AS total_users FROM user;'
  },
  {
    name: 'Active Hotspot Users',
    type: 'stat_card',
    icon: 'Wifi',
    color: 'emerald',
    suffix: 'Active',
    subtitle: 'Accounts currently enabled',
    sql: 'SELECT COUNT(*) AS active_users FROM user WHERE disabled = 0;'
  },
  {
    name: 'Total Sessions Count',
    type: 'stat_card',
    icon: 'Radio',
    color: 'purple',
    suffix: 'Sessions',
    subtitle: 'Historical session connections',
    sql: 'SELECT COUNT(*) AS total_sessions FROM usermgr_sessions;'
  },
  {
    name: 'Top 5 Users by Download',
    type: 'table',
    sql: 'SELECT CAST(userName AS TEXT) AS User, downloadUsed FROM user ORDER BY downloadUsed DESC LIMIT 5;'
  },
  {
    name: 'Database Tables Summary',
    type: 'table',
    sql: "SELECT name FROM sqlite_master WHERE type='table';"
  }
];

export default function AddWidgetModal({ isOpen, initialData, onClose, onSave, dashboardId }) {
  const isEditing = !!(initialData && initialData.id);

  const [formData, setFormData] = useState({
    name: '',
    type: 'table',
    chartType: 'bar',
    icon: 'Activity',
    color: 'cyan',
    prefix: '',
    suffix: '',
    subtitle: '',
    xAxisCol: '',
    yAxisCols: [],
    dualAxis: false,
    chartMode: 'grouped',
    size: 'half',
    dbPath: 'data/userman_active.db',
    sql: 'SELECT * FROM user LIMIT 10;'
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        type: initialData.type || 'table',
        chartType: initialData.chartType || 'bar',
        icon: initialData.icon || 'Activity',
        color: initialData.color || 'cyan',
        prefix: initialData.prefix || '',
        suffix: initialData.suffix || '',
        subtitle: initialData.subtitle || '',
        xAxisCol: initialData.xAxisCol || '',
        yAxisCols: Array.isArray(initialData.yAxisCols) ? initialData.yAxisCols : [],
        dualAxis: !!initialData.dualAxis,
        chartMode: initialData.chartMode || 'grouped',
        size: initialData.size || 'half',
        dbPath: initialData.dbPath || 'data/userman_active.db',
        sql: initialData.sql || 'SELECT * FROM user LIMIT 10;'
      });

      if (initialData.sql) {
        runTestQuery(initialData.sql, initialData.dbPath || 'data/userman_active.db');
      } else {
        setTestResult(null);
        setTestError(null);
      }
    } else {
      setFormData({
        name: '',
        type: 'table',
        chartType: 'bar',
        icon: 'Activity',
        color: 'cyan',
        prefix: '',
        suffix: '',
        subtitle: '',
        xAxisCol: '',
        yAxisCols: [],
        dualAxis: false,
        chartMode: 'grouped',
        size: 'half',
        dbPath: 'data/userman_active.db',
        sql: 'SELECT * FROM user LIMIT 10;'
      });
      setTestResult(null);
      setTestError(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const runTestQuery = async (sqlToTest = formData.sql, targetDbPath = formData.dbPath) => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await apiFetch('/api/dashboard/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sql: sqlToTest,
          dbPath: targetDbPath
        })
      });
      const data = await res.json();

      if (data.success) {
        setTestResult(data);
        if (data.columns && data.columns.length > 0) {
          const defaultX = data.columns[0];
          const defaultY = data.columns.slice(1);

          setFormData(prev => ({
            ...prev,
            xAxisCol: prev.xAxisCol || defaultX,
            yAxisCols: prev.yAxisCols && prev.yAxisCols.length > 0 ? prev.yAxisCols : (defaultY.length > 0 ? defaultY : [defaultX])
          }));
        }
      } else {
        setTestError(data.error || 'Query failed to execute');
      }
    } catch (err) {
      setTestError('Network error testing SQL query.');
    } finally {
      setTesting(false);
    }
  };

  const applyTemplate = (tpl) => {
    setFormData(prev => ({
      ...prev,
      name: tpl.name,
      type: tpl.type,
      icon: tpl.icon || prev.icon,
      color: tpl.color || prev.color,
      prefix: tpl.prefix || '',
      suffix: tpl.suffix || '',
      subtitle: tpl.subtitle || '',
      sql: tpl.sql
    }));
    runTestQuery(tpl.sql, formData.dbPath);
  };

  const toggleYAxisCol = (colName) => {
    setFormData(prev => {
      const current = prev.yAxisCols || [];
      const updated = current.includes(colName)
        ? current.filter(c => c !== colName)
        : [...current, colName];
      return { ...prev, yAxisCols: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...formData,
      dashboardId
    });
    onClose();
  };

  const availableCols = testResult && testResult.columns ? testResult.columns : [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        borderRadius: 'var(--radius-xl)',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        border: '1px solid var(--border-active)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              {isEditing ? <Edit3 style={{ width: '18px', height: '18px' }} /> : <Plus style={{ width: '18px', height: '18px' }} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Widget' : 'Add Dashboard Widget'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Customize query, display type, icon, and mobile styling
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Quick Starter Templates */}
          {!isEditing && (
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles style={{ width: '13px', height: '13px', color: 'var(--accent-amber)' }} />
                Quick Starter Templates:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {QUICK_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    style={{
                      background: 'rgba(6, 182, 212, 0.08)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    + {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="label-text">
              Widget Title / Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="e.g. Active Hotspot Users, Daily Traffic..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Type Select & Width Size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="label-text">Widget Type</label>
              <select 
                className="input-field"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="stat_card">Stat Card (Single Metric Summary)</option>
                <option value="table">Data Table (Multi-row Grid)</option>
                <option value="chart">Chart Graph (Bar / Line / Pie / Doughnut)</option>
              </select>
            </div>

            <div>
              <label className="label-text">Dashboard Card Width</label>
              <select 
                className="input-field"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              >
                <option value="third">1/3 Width (Compact on Tablets/PC)</option>
                <option value="half">Half Width (Default)</option>
                <option value="full">Full Width (100% Columns)</option>
              </select>
            </div>
          </div>

          {/* STAT CARD CUSTOMIZATION OPTIONS */}
          {formData.type === 'stat_card' && (
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity style={{ width: '15px', height: '15px' }} />
                Stat Card Customization (Icon, Colors & Subtitles)
              </div>

              {/* Icon Selector */}
              <div>
                <label className="label-text" style={{ marginBottom: '6px' }}>Choose Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {AVAILABLE_ICONS.map((item, idx) => {
                    const IconComp = item.icon;
                    const isSelected = formData.icon === item.name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: item.name })}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={item.name}
                      >
                        <IconComp style={{ width: '18px', height: '18px' }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Accent Selector */}
              <div>
                <label className="label-text" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Stat Card Color Theme</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Calm tones or vibrant accents</span>
                </label>

                {/* Calm & Muted Colors */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    ☕ Calm & Executive Tones:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {CALM_COLORS.map(c => {
                      const isSelected = formData.color === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c.key })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            background: isSelected ? c.bg : 'var(--bg-input)',
                            border: isSelected ? `2px solid ${c.border}` : '1px solid var(--border-color)',
                            color: isSelected ? c.border : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.border }} />
                          {c.label.replace(' (Calm)', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vibrant Accent Colors */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    ⚡ Vibrant Accents:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {VIBRANT_COLORS.map(c => {
                      const isSelected = formData.color === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c.key })}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '0.76rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            background: isSelected ? c.bg : 'var(--bg-input)',
                            border: isSelected ? `2px solid ${c.border}` : '1px solid var(--border-color)',
                            color: isSelected ? c.border : 'var(--text-dim)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.border }} />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Prefix & Suffix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label-text">Prefix Symbol</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. $, #"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Suffix Unit</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Users, MB, %"
                    value={formData.suffix}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="label-text">Subtitle / Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Active Hotspot sessions right now"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* CHART OPTIONS */}
          {formData.type === 'chart' && (
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 style={{ width: '16px', height: '16px' }} />
                Chart Configuration & Mobile Line Styling
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label-text">Chart Graph Subtype</label>
                  <select 
                    className="input-field"
                    value={formData.chartType}
                    onChange={(e) => setFormData({ ...formData, chartType: e.target.value })}
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart (Sleek Mobile Sparkline)</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">Chart Layout Mode</label>
                  <select 
                    className="input-field"
                    value={formData.chartMode}
                    onChange={(e) => setFormData({ ...formData, chartMode: e.target.value })}
                  >
                    <option value="grouped">Grouped (Side-by-Side)</option>
                    <option value="stacked">Stacked Bars / Area</option>
                  </select>
                </div>
              </div>

              {/* X-Axis Column Selector */}
              {availableCols.length > 0 && (
                <div>
                  <label className="label-text">X-Axis Label Column</label>
                  <select
                    className="input-field"
                    value={formData.xAxisCol || availableCols[0]}
                    onChange={(e) => setFormData({ ...formData, xAxisCol: e.target.value })}
                  >
                    {availableCols.map((col, idx) => (
                      <option key={idx} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Data Series Y-Axis Columns */}
              {availableCols.length > 0 && (
                <div>
                  <label className="label-text">Data Series (Y-Axis Values)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {availableCols.map((col, idx) => {
                      const isSelected = formData.yAxisCols.includes(col);
                      const isXCol = (formData.xAxisCol || availableCols[0]) === col;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleYAxisCol(col)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(125, 125, 125, 0.08)',
                            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            opacity: isXCol ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            readOnly 
                            style={{ cursor: 'pointer' }}
                          />
                          {col} {isXCol && '(Label)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database Path */}
          <div>
            <label className="label-text">Database Target</label>
            <div style={{ position: 'relative' }}>
              <Database style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--accent-cyan)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                placeholder="data/userman_active.db"
                value={formData.dbPath}
                onChange={(e) => setFormData({ ...formData, dbPath: e.target.value })}
              />
            </div>
          </div>

          {/* SQL Textarea */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="label-text" style={{ marginBottom: 0 }}>
                SQL Statement <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>

              <button
                type="button"
                onClick={() => runTestQuery()}
                disabled={testing}
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              >
                {testing ? (
                  <>
                    <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
                    Running...
                  </>
                ) : (
                  <>
                    <Play style={{ width: '13px', height: '13px', color: 'var(--accent-cyan)' }} />
                    Test Query
                  </>
                )}
              </button>
            </div>

            <textarea
              required
              rows={3}
              className="input-field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.4 }}
              placeholder="SELECT COUNT(*) as activeUsers FROM user WHERE disabled = 0;"
              value={formData.sql}
              onChange={(e) => setFormData({ ...formData, sql: e.target.value })}
            />
          </div>

          {/* Query Test Results / Error */}
          {testError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--accent-rose)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', shrink: 0 }} />
              <div>{testError}</div>
            </div>
          )}

          {testResult && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--accent-emerald)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', shrink: 0 }} />
              <div>Query valid! Returned {testResult.rowCount} {testResult.rowCount === 1 ? 'row' : 'rows'}. Columns: {testResult.columns.join(', ')}</div>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {isEditing ? 'Save Changes' : 'Add Widget'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
