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
  BarChart2
} from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function AddWidgetModal({ isOpen, initialData, onClose, onSave }) {
  const isEditing = !!(initialData && initialData.id);

  const [formData, setFormData] = useState({
    name: '',
    type: 'table', // stat_card, table, chart
    chartType: 'bar', // bar, line, pie, doughnut
    xAxisCol: '',
    yAxisCols: [],
    dualAxis: false,
    chartMode: 'grouped', // grouped, stacked
    size: 'half', // full, half, third
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
        xAxisCol: initialData.xAxisCol || '',
        yAxisCols: Array.isArray(initialData.yAxisCols) ? initialData.yAxisCols : [],
        dualAxis: !!initialData.dualAxis,
        chartMode: initialData.chartMode || 'grouped',
        size: initialData.size || 'half',
        dbPath: initialData.dbPath || 'data/userman_active.db',
        sql: initialData.sql || 'SELECT * FROM user LIMIT 10;'
      });

      // Auto test query when editing to detect column schema
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
        
        // Auto-assign default X-axis and Y-axis if not already specified
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

    onSave(formData);
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
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        borderRadius: 'var(--radius-xl)',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid var(--border-active)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
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
              {isEditing ? <Edit3 style={{ width: '20px', height: '20px' }} /> : <Plus style={{ width: '20px', height: '20px' }} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Dashboard Item' : 'Add Dashboard Item'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Configure dynamic SQL query, visualization type, multi-series options, and layout bounds
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Item Name */}
          <div>
            <label className="label-text">
              Item Title / Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="e.g. Daily Sales & Traffic, Active Users Count..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Database Path */}
          <div>
            <label className="label-text">
              Target Database File Path
            </label>
            <div style={{ position: 'relative' }}>
              <Database style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--accent-cyan)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)' }}
                placeholder="data/userman_active.db"
                value={formData.dbPath}
                onChange={(e) => setFormData({ ...formData, dbPath: e.target.value })}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Default active database: <code style={{ color: 'var(--accent-cyan)' }}>data/userman_active.db</code> (or custom path like <code style={{ color: 'var(--accent-purple)' }}>data/backups/...</code>)
            </div>
          </div>

          {/* Type Select & Width Size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <option value="third">1/3 Width (4 Columns)</option>
                <option value="half">Half Width (6 Columns - Default)</option>
                <option value="full">Full Width (12 Columns)</option>
              </select>
            </div>
          </div>

          {/* Subtype options for Chart */}
          {formData.type === 'chart' && (
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 style={{ width: '16px', height: '16px' }} />
                Chart Configuration & Multi-Column Mapping
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
                    <option value="line">Line Chart</option>
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

              {/* X-Axis Label Column Selector */}
              {availableCols.length > 0 && (
                <div>
                  <label className="label-text">X-Axis Label Column (Horizontal Axis)</label>
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

              {/* Data Series Y-Axis Columns Selection */}
              {availableCols.length > 0 && (
                <div>
                  <label className="label-text">Data Series to Plot (Y-Axis Values)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                    {availableCols.map((col, idx) => {
                      const isSelected = formData.yAxisCols.includes(col);
                      const isXCol = (formData.xAxisCol || availableCols[0]) === col;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleYAxisCol(col)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
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

              {/* Dual Y-Axis Checkbox */}
              {formData.yAxisCols.length > 1 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <input 
                    type="checkbox"
                    checked={formData.dualAxis}
                    onChange={(e) => setFormData({ ...formData, dualAxis: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
                  />
                  Enable Dual Y-Axes (Separate scales for left & right values, e.g. Count vs Money)
                </label>
              )}
            </div>
          )}

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
              rows={4}
              className="input-field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', lineHeight: 1.4 }}
              placeholder="SELECT COUNT(*) as activeUsers FROM user WHERE disabled = 0;"
              value={formData.sql}
              onChange={(e) => setFormData({ ...formData, sql: e.target.value })}
            />
          </div>

          {/* Test Results Preview Box */}
          {testError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle style={{ width: '18px', height: '18px', shrink: 0 }} />
              <div>{testError}</div>
            </div>
          )}

          {testResult && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-emerald)', fontWeight: '700', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  Query Executed Successfully! ({testResult.rowCount} {testResult.rowCount === 1 ? 'row' : 'rows'} returned)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Detected Columns: {availableCols.join(', ')}
                </div>
              </div>

              {/* Sample Data Table Preview */}
              <div style={{ overflowX: 'auto', maxHeight: '140px', marginTop: '4px' }}>
                <table className="data-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      {availableCols.map((col, idx) => (
                        <th key={idx}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testResult.rows.slice(0, 3).map((row, rIdx) => (
                      <tr key={rIdx}>
                        {availableCols.map((col, cIdx) => (
                          <td key={cIdx}>{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Save & Cancel Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px'
          }}>
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
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              {isEditing ? 'Update Item' : 'Save Dashboard Item'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
