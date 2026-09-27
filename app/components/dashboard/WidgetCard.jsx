'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Edit3,
  RefreshCw, 
  Table as TableIcon, 
  BarChart3, 
  PieChart, 
  Activity, 
  AlertCircle, 
  Loader2,
  Database,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowRightLeft,
  Trash2,
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
  Layers,
  Zap
} from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

const ICON_MAP = {
  Activity,
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
  Layers,
  Zap,
  BarChart3,
  Database
};

const COLOR_THEMES = {
  // Calm & Muted Color Options
  slate: { text: 'var(--color-slate-text)', bg: 'var(--color-slate-bg)', border: 'var(--color-slate-border)' },
  sage: { text: 'var(--color-sage-text)', bg: 'var(--color-sage-bg)', border: 'var(--color-sage-border)' },
  teal: { text: 'var(--color-teal-text)', bg: 'var(--color-teal-bg)', border: 'var(--color-teal-border)' },
  indigo: { text: 'var(--color-indigo-text)', bg: 'var(--color-indigo-bg)', border: 'var(--color-indigo-border)' },
  sand: { text: 'var(--color-sand-text)', bg: 'var(--color-sand-bg)', border: 'var(--color-sand-border)' },
  lavender: { text: 'var(--color-lavender-text)', bg: 'var(--color-lavender-bg)', border: 'var(--color-lavender-border)' },
  dusty_rose: { text: 'var(--color-dusty-rose-text)', bg: 'var(--color-dusty-rose-bg)', border: 'var(--color-dusty-rose-border)' },

  // Vibrant Color Accents
  cyan: { text: 'var(--accent-cyan)', bg: 'var(--accent-cyan-glow)', border: 'var(--border-active)' },
  emerald: { text: 'var(--accent-emerald)', bg: 'var(--accent-emerald-glow)', border: 'rgba(16, 185, 129, 0.3)' },
  purple: { text: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
  amber: { text: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  rose: { text: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
  blue: { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' }
};
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function WidgetCard({ 
  item, 
  isFirst, 
  isLast, 
  onMoveLeft, 
  onMoveRight, 
  onEditClick, 
  onDeleteClick,
  dashboards = [],
  onMoveClick
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchQueryResult();
  }, [item.sql, item.dbPath]);

  const fetchQueryResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/dashboard/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sql: item.sql,
          dbPath: item.dbPath || 'data/userman_active.db'
        })
      });
      const result = await res.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to execute query');
      }
    } catch (err) {
      setError('Failed to reach backend query server.');
    } finally {
      setLoading(false);
    }
  };

  // Determine column size styling based on item.size
  const getSizeStyle = (size) => {
    switch (size) {
      case 'full':
        return { gridColumn: 'span 12' };
      case 'third':
        return { gridColumn: 'span 4' };
      case 'half':
      default:
        return { gridColumn: 'span 6' };
    }
  };

  // Helper for Chart.js multi-series dataset building
  const buildChartData = (rows, columns, chartType) => {
    if (!rows || rows.length === 0 || !columns || columns.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Determine X-axis label column
    const labelKey = (item.xAxisCol && columns.includes(item.xAxisCol))
      ? item.xAxisCol
      : columns[0];

    const labels = rows.map(r => String(r[labelKey] ?? ''));

    // Determine Y-axis data series columns
    let seriesCols = [];
    if (Array.isArray(item.yAxisCols) && item.yAxisCols.length > 0) {
      seriesCols = item.yAxisCols.filter(c => columns.includes(c) && c !== labelKey);
    }
    if (seriesCols.length === 0) {
      seriesCols = columns.filter(c => c !== labelKey);
    }
    if (seriesCols.length === 0) {
      seriesCols = [columns[0]];
    }

    const colorPalettes = [
      { bg: 'rgba(6, 182, 212, 0.75)', border: '#06b6d4' },
      { bg: 'rgba(16, 185, 129, 0.75)', border: '#10b981' },
      { bg: 'rgba(139, 92, 246, 0.75)', border: '#8b5cf6' },
      { bg: 'rgba(245, 158, 11, 0.75)', border: '#f59e0b' },
      { bg: 'rgba(244, 63, 94, 0.75)', border: '#f43f5e' },
      { bg: 'rgba(59, 130, 246, 0.75)', border: '#3b82f6' }
    ];

    const datasets = seriesCols.map((colName, idx) => {
      const values = rows.map(r => Number(r[colName]) || 0);
      const palette = colorPalettes[idx % colorPalettes.length];
      const isLine = chartType === 'line';

      const dataset = {
        label: colName,
        data: values,
        backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
          ? colorPalettes.map(c => c.bg) 
          : isLine 
            ? palette.border + '18' // Soft translucent gradient fill (10% opacity)
            : palette.bg,
        borderColor: chartType === 'pie' || chartType === 'doughnut' 
          ? colorPalettes.map(c => c.border) 
          : palette.border,
        borderWidth: isLine ? 2.5 : 2,
        borderRadius: isLine ? 0 : 6,
        fill: isLine,
        tension: isLine ? 0.35 : 0, // Smooth curves instead of sharp angles
        pointRadius: isLine ? 0 : 3, // Sleek Sparkline: no fat/wide dots crowding the mobile line!
        pointHoverRadius: isLine ? 6 : 6, // Points pop up smoothly when finger touches/drags
        pointHitRadius: isLine ? 25 : 10, // Large touch area so it's super easy to tap on phones
        pointBackgroundColor: palette.border,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      };

      if (item.dualAxis && seriesCols.length > 1) {
        dataset.yAxisID = idx === 0 ? 'y' : 'y1';
      }

      return dataset;
    });

    return { labels, datasets };
  };

  const isStacked = item.chartMode === 'stacked';
  const hasDualAxis = item.dualAxis && item.type === 'chart';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { 
          color: 'var(--text-muted)', 
          font: { family: 'Outfit', size: 11 },
          boxWidth: 10,
          padding: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: item.chartType === 'pie' || item.chartType === 'doughnut' ? {} : {
      x: { 
        stacked: isStacked,
        ticks: { 
          color: 'var(--text-muted)',
          autoSkip: true,
          maxTicksLimit: 5,
          maxRotation: 0,
          font: { family: 'Outfit', size: 10 }
        }, 
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false } 
      },
      y: { 
        type: 'linear',
        display: true,
        position: 'left',
        stacked: isStacked,
        ticks: { 
          color: 'var(--text-muted)',
          maxTicksLimit: 5,
          font: { family: 'Outfit', size: 10 }
        }, 
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false } 
      },
      ...(hasDualAxis ? {
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          ticks: { 
            color: 'var(--accent-purple)',
            maxTicksLimit: 5,
            font: { family: 'Outfit', size: 10 }
          },
          grid: { drawOnChartArea: false }
        }
      } : {})
    }
  };

  const CardIcon = (item.icon && ICON_MAP[item.icon]) ? ICON_MAP[item.icon] : Activity;
  const theme = COLOR_THEMES[item.color] || COLOR_THEMES.cyan;

  return (
    <div 
      className={`glass-panel ${item.type === 'stat_card' ? 'stat-card-widget' : ''}`} 
      style={{
        ...getSizeStyle(item.size),
        borderRadius: 'var(--radius-lg)',
        padding: item.type === 'stat_card' ? '14px 16px' : '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        minWidth: 0,
        maxWidth: '100%'
      }}
    >
      
      {/* Widget Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          {item.type === 'stat_card' && <CardIcon style={{ width: '18px', height: '18px', color: theme.text, flexShrink: 0 }} />}
          {item.type === 'table' && <TableIcon style={{ width: '18px', height: '18px', color: 'var(--accent-purple)', flexShrink: 0 }} />}
          {item.type === 'chart' && <BarChart3 style={{ width: '18px', height: '18px', color: 'var(--accent-emerald)', flexShrink: 0 }} />}
          
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
            {item.dbPath && item.dbPath !== 'data/userman_active.db' && (
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Database style={{ width: '10px', height: '10px', flexShrink: 0 }} />
                {item.dbPath.split('\\').pop().split('/').pop()}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Refresh Button */}
          <button 
            onClick={fetchQueryResult} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-dim)', 
              cursor: 'pointer', 
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Refresh query data"
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          {/* Action Button (More Options Dropdown) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              style={{
                background: showMenu ? 'var(--bg-secondary)' : 'rgba(125,125,125,0.08)',
                border: '1px solid',
                borderColor: showMenu ? 'var(--border-active)' : 'transparent',
                color: showMenu ? 'var(--text-main)' : 'var(--text-dim)',
                cursor: 'pointer',
                padding: '5px 7px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Widget actions"
            >
              <MoreVertical style={{ width: '15px', height: '15px' }} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
                  onClick={() => setShowMenu(false)} 
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 6px)',
                    zIndex: 1000,
                    minWidth: '175px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(16px)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {/* Edit Widget */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onEditClick) onEditClick(item);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Edit3 style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />
                    Edit Widget
                  </button>

                  {/* Move to Dashboard (Only if more than 1 dashboard) */}
                  {dashboards && dashboards.length > 1 && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (onMoveClick) onMoveClick(item);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <ArrowRightLeft style={{ width: '14px', height: '14px', color: 'var(--accent-cyan)' }} />
                      Move to Dashboard
                    </button>
                  )}

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />

                  {/* Delete Widget */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onDeleteClick) onDeleteClick(item);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--accent-rose)',
                      fontSize: '0.84rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    Delete Widget
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Widget Content Body */}
      {loading && (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', color: 'var(--accent-cyan)' }} />
          Executing query...
        </div>
      )}

      {!loading && error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          color: 'var(--accent-rose)',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <div>{error}</div>
          </div>
          {error.includes('does not exist') && (
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await apiFetch('/api/userman/sync', { method: 'POST' });
                  const d = await res.json();
                  if (d.success) {
                    runQuery();
                  } else {
                    setError(d.error || 'Failed to download sqldb from router.');
                  }
                } catch (e) {
                  setError('Network sync error: ' + (e.message || e.toString()));
                } finally {
                  setLoading(false);
                }
              }}
              className="btn btn-primary"
              style={{
                alignSelf: 'flex-start',
                fontSize: '0.78rem',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw style={{ width: '13px', height: '13px' }} />
              Download & Sync Database Now
            </button>
          )}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* STAT CARD VIEW */}
          {item.type === 'stat_card' && (() => {
            const rawVal = data.rows && data.rows.length > 0 
              ? (Object.values(data.rows[0])[0] ?? '0') 
              : '0';
            const theme = COLOR_THEMES[item.color] || COLOR_THEMES.cyan;
            const CardIcon = ICON_MAP[item.icon] || Activity;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: '800',
                  color: theme.text,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.prefix || ''}{rawVal}{item.suffix ? ` ${item.suffix}` : ''}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.subtitle || `Result from ${data.rowCount} ${data.rowCount === 1 ? 'row' : 'rows'}`}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <Database style={{ width: '10px', height: '10px', color: 'var(--accent-cyan)' }} />
                    {data.rowCount} r
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TABLE VIEW */}
          {item.type === 'table' && (
            <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
              {data.rows && data.rows.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      {data.columns.map((col, i) => (
                        <th key={i}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {data.columns.map((col, cIdx) => (
                          <td key={cIdx}>
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '16px', color: 'var(--text-dim)', textAlign: 'center', fontSize: '0.85rem' }}>
                  No rows returned by query.
                </div>
              )}
            </div>
          )}

          {/* CHART VIEW */}
          {item.type === 'chart' && (
            <div style={{ height: '230px', position: 'relative' }}>
              {item.chartType === 'line' && <Line data={buildChartData(data.rows, data.columns, 'line')} options={chartOptions} />}
              {item.chartType === 'pie' && <Pie data={buildChartData(data.rows, data.columns, 'pie')} options={chartOptions} />}
              {item.chartType === 'doughnut' && <Doughnut data={buildChartData(data.rows, data.columns, 'doughnut')} options={chartOptions} />}
              {(!item.chartType || item.chartType === 'bar') && <Bar data={buildChartData(data.rows, data.columns, 'bar')} options={chartOptions} />}
            </div>
          )}
        </>
      )}

    </div>
  );
}
