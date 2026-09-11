import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import AdminLayout from '../components/AdminLayout'
import StatCard from '../components/StatCard'
import { fetchAdminDashboard, fetchAdminCharts } from '../services/adminService'

// Severity / risk colour maps
const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  informational: '#6b7280',
  unknown: '#6b7280',
}

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
  unknown: '#6b7280',
}

const tooltipStyle = {
  contentStyle: { background: '#141c30', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [charts, setCharts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchAdminDashboard(), fetchAdminCharts()])
      .then(([s, c]) => { setStats(s); setCharts(c) })
      .catch(() => setError('Failed to load dashboard data.'))
  }, [])

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-red-400 text-sm">{error}</div>
      </AdminLayout>
    )
  }

  if (!stats) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-slate-500 text-sm animate-pulse">Loading statistics…</div>
      </AdminLayout>
    )
  }

  // Transform chart data
  const findingsBySeverity = charts
    ? Object.entries(charts.findings_by_severity).map(([name, value]) => ({ name, value }))
    : []

  const riskDistribution = charts
    ? Object.entries(charts.risk_level_distribution).map(([name, value]) => ({ name, value }))
    : []

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.total_users} accent="blue"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
          <StatCard label="Active Users" value={stats.active_users} accent="green"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Inactive Users" value={stats.inactive_users} accent="yellow"
            isEmpty={stats.inactive_users === 0}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
          />
          <StatCard label="Total Scans" value={stats.total_scans} accent="blue"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
          />
          <StatCard label="Total Findings" value={stats.total_findings} accent="orange"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
          />
          <StatCard label="High Risk Scans" value={stats.high_risk_scans} accent="red"
            isEmpty={stats.high_risk_scans === 0}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          />
          <StatCard label="Critical Findings" value={stats.critical_findings} accent="red"
            isEmpty={stats.critical_findings === 0}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          />
        </div>

        {/* Charts row */}
        {charts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Users over time */}
            <ChartCard title="User Registrations Over Time">
              {charts.users_over_time.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={charts.users_over_time}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Users" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Scans over time */}
            <ChartCard title="Scans Over Time">
              {charts.scans_over_time.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={charts.scans_over_time}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} name="Scans" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Findings by severity */}
            <ChartCard title="Findings by Severity">
              {findingsBySeverity.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={findingsBySeverity}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" name="Findings" radius={[4, 4, 0, 0]}>
                      {findingsBySeverity.map((entry) => (
                        <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Risk level distribution */}
            <ChartCard title="Risk Level Distribution">
              {riskDistribution.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {riskDistribution.map((entry) => (
                        <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl p-5 bg-[var(--bg-card)] border border-[var(--border-color)]">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[200px] text-slate-600 text-sm">
      No data available
    </div>
  )
}
