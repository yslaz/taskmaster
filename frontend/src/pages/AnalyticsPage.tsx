import React, { useState, useEffect } from 'react';
import statsService from '../services/stats';
import type { TaskStats, StatsQuery } from '../services/stats';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Custom compact tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '3px',
        padding: '2px 6px',
        fontSize: '10px',
        maxWidth: '80px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        lineHeight: '1.2',
        transform: 'translate(10px, -10px)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {label && <p style={{ margin: '0', fontWeight: 'bold', fontSize: '10px' }}>{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: '1px 0 0 0', color: entry.color, fontSize: '9px' }}>
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter controls
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query: StatsQuery = {
        period,
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
      };
      
      const data = await statsService.getAnalyticsStats(query);
      setStats(data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const handleApplyFilters = () => {
    loadAnalyticsData();
  };

  const handleClearFilters = () => {
    setPeriod('day');
    setFromDate('');
    setToDate('');
    loadAnalyticsData();
  };

  // Prepare data for charts
  const timeSeriesData = stats ? stats.time_series.labels.map((label, index) => ({
    date: label,
    created: stats.time_series.created[index] || 0,
    completed: stats.time_series.completed[index] || 0,
  })) : [];

  const statusData = stats ? Object.entries(stats.tasks_by_status).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : [];

  const priorityData = stats ? Object.entries(stats.tasks_by_priority).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : [];

  if (loading) {
    return (
      <div style={{ padding: '0.5rem', textAlign: 'center' }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div style={{ padding: '0.5rem', maxWidth: '100%' }}>
      
      {/* Compact Filter Controls */}
      <div className="analytics-control-bar" style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '0.25rem',
        padding: '0.25rem',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <label className="analytics-control-label">Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="analytics-select-input"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <label className="analytics-control-label">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="analytics-date-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <label className="analytics-control-label">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="analytics-date-input"
          />
        </div>

        <button
          onClick={handleApplyFilters}
          disabled={loading}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: '0.15s',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
          }}
        >
          Apply
        </button>

        <button
          onClick={handleClearFilters}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: '0.15s',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
          }}
        >
          Clear
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '0.5rem', 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          borderRadius: '6px',
          marginBottom: '0.75rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Compact KPIs */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '0.25rem',
            marginBottom: '0.25rem'
          }}>
            <div style={{ padding: '0.25rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="analytics-card stats-card">
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', textAlign: 'center', width: '100%' }}>{stats.total_tasks}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', width: '100%' }}>Total</div>
            </div>
            <div style={{ padding: '0.25rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="analytics-card completion-card">
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669', textAlign: 'center', width: '100%' }}>{stats.completion_rate.toFixed(1)}%</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', width: '100%' }}>Complete</div>
            </div>
            <div style={{ padding: '0.25rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="analytics-card stats-card">
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', textAlign: 'center', width: '100%' }}>{stats.overdue_tasks}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', width: '100%' }}>Overdue</div>
            </div>
            <div style={{ padding: '0.25rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="analytics-card productivity-card">
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', textAlign: 'center', width: '100%' }}>{stats.due_today}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', width: '100%' }}>Due Today</div>
            </div>
          </div>

          {/* Charts Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.25rem',
              marginBottom: '0.25rem',
              position: 'relative',
              overflow: 'visible'
            }} className="charts-grid">
            {/* Time Series Chart */}
            <div style={{ position: 'relative', overflow: 'visible' }} className="chart-container">
              <div className="chart-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Task Activity Over Time</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={<CustomTooltip />}
                    wrapperStyle={{ 
                      zIndex: 9999, 
                      pointerEvents: 'none',
                      position: 'absolute',
                      outline: 'none'
                    }}
                    isAnimationActive={false}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution */}
            <div style={{ position: 'relative', overflow: 'visible' }} className="chart-container primary">
              <div className="chart-header primary">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Tasks by Status</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip />}
                    wrapperStyle={{ 
                      zIndex: 9999, 
                      pointerEvents: 'none',
                      position: 'absolute',
                      outline: 'none'
                    }}
                    isAnimationActive={false}
                  />
                  <Legend />
                </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution */}
            <div style={{ position: 'relative', overflow: 'visible' }} className="chart-container secondary">
              <div className="chart-header secondary">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Tasks by Priority</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={<CustomTooltip />}
                    wrapperStyle={{ 
                      zIndex: 9999, 
                      pointerEvents: 'none',
                      position: 'absolute',
                      outline: 'none'
                    }}
                    isAnimationActive={false}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Compact Time Series Table */}
          <div className="chart-container table-container">
            <div className="chart-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Time Series Data</h3>
            </div>
            <div className="chart-content" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr className="table-header">
                    <th style={{ padding: '0.25rem 0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                    <th style={{ padding: '0.25rem 0.5rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Created</th>
                    <th style={{ padding: '0.25rem 0.5rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {timeSeriesData.map((row, index) => (
                    <tr key={index}>
                      <td style={{ padding: '0.25rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>{row.date}</td>
                      <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{row.created}</td>
                      <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{row.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
