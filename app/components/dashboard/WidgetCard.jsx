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
  ChevronRight
} from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
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

export default function WidgetCard({ item, isFirst, isLast, onMoveLeft, onMoveRight, onEditClick, onDeleteClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      const dataset = {
        label: colName,
        data: values,
        backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
          ? colorPalettes.map(c => c.bg) 
          : palette.bg,
        borderColor: chartType === 'pie' || chartType === 'doughnut' 
          ? colorPalettes.map(c => c.border) 
          : palette.border,
        borderWidth: 2,
        borderRadius: 6
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
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'var(--text-muted)', font: { family: 'Outfit' } }
      }
    },
    scales: item.chartType === 'pie' || item.chartType === 'doughnut' ? {} : {
      x: { 
        stacked: isStacked,
        ticks: { 
          color: 'var(--text-muted)',
          autoSkip: true,
          maxTicksLimit: 6,
          maxRotation: 0,
          font: { family: 'Outfit', size: 10 }
        }, 
        grid: { color: 'rgba(125,125,125,0.08)' } 
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
        grid: { color: 'rgba(125,125,125,0.08)' } 
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
          {item.type === 'stat_card' && <Activity style={{ width: '18px', height: '18px', color: 'var(--accent-cyan)', flexShrink: 0 }} />}
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
          {/* Quick Reorder Arrow Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(125,125,125,0.08)', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => onMoveLeft && onMoveLeft(item.id)}
              disabled={isFirst}
              style={{
                background: 'transparent',
                border: 'none',
                color: isFirst ? 'var(--text-dim)' : 'var(--text-main)',
                cursor: isFirst ? 'not-allowed' : 'pointer',
                padding: '3px 4px',
                display: 'flex',
                alignItems: 'center',
                opacity: isFirst ? 0.3 : 1
              }}
              title="Move position left"
            >
              <ChevronLeft style={{ width: '15px', height: '15px' }} />
            </button>

            <button
              onClick={() => onMoveRight && onMoveRight(item.id)}
              disabled={isLast}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLast ? 'var(--text-dim)' : 'var(--text-main)',
                cursor: isLast ? 'not-allowed' : 'pointer',
                padding: '3px 4px',
                display: 'flex',
                alignItems: 'center',
                opacity: isLast ? 0.3 : 1
              }}
              title="Move position right"
            >
              <ChevronRight style={{ width: '15px', height: '15px' }} />
            </button>
          </div>

          {/* Refresh Button */}
          <button 
            onClick={fetchQueryResult} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
            title="Refresh query data"
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          {/* Edit Button */}
          <button 
            onClick={() => onEditClick(item)} 
            style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              border: '1px solid rgba(139, 92, 246, 0.25)', 
              color: 'var(--accent-purple)', 
              cursor: 'pointer', 
              padding: '4px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Edit item configuration"
          >
            <Edit3 style={{ width: '14px', height: '14px' }} />
          </button>

          {/* X Remove Button */}
          <button 
            onClick={() => onDeleteClick(item)} 
            style={{ 
              background: 'rgba(244, 63, 94, 0.1)', 
              border: '1px solid rgba(244, 63, 94, 0.25)', 
              color: 'var(--accent-rose)', 
              cursor: 'pointer', 
              padding: '4px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Remove item from dashboard"
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
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
          padding: '12px',
          color: 'var(--accent-rose)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle style={{ width: '16px', height: '16px', shrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* STAT CARD VIEW */}
          {item.type === 'stat_card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                {data.rows && data.rows.length > 0 
                  ? (Object.values(data.rows[0])[0] ?? '0') 
                  : '0'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database style={{ width: '12px', height: '12px', color: 'var(--accent-cyan)' }} />
                Result from {data.rowCount} {data.rowCount === 1 ? 'row' : 'rows'}
              </div>
            </div>
          )}

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
