import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Empty, ErrorBox, PageHead, RiskBadge, Skeleton, fmt, useFetch } from './shared'

const COLORS = { low_risk: '#26815F', suspicious: '#D99227', high_risk: '#C83D4D', inconclusive: '#3478B9' }

export default function Overview() {
  const [days, setDays] = useState(30)
  const stats = useFetch(`/dashboard/stats?days=${days}`)
  const trends = useFetch(`/dashboard/trends?days=${days}`)
  const dist = useFetch(`/dashboard/risk-distribution?days=${days}`)
  const recent = useFetch('/analysis?page_size=6')
  const audit = useFetch('/audit-logs')

  const cards = stats.data && [
    ['Total Emails Analyzed', stats.data.total_analyzed], ['Phishing Detected', stats.data.high_risk],
    ['Suspicious Emails', stats.data.suspicious], ['Quarantined Emails', stats.data.quarantined],
  ]

  return (
    <>
      <PageHead title="Security Overview" subtitle="Monitor email activity and review potential threats.">
        <div className="flex items-center gap-3">
          <label htmlFor="range" className="sr-only">Date range</label>
          <select id="range" className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)}>
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
          <Link to="/app/analyze" className="btn-primary">Quick Analyze Email</Link>
        </div>
      </PageHead>

      {stats.error ? <ErrorBox message={stats.error} retry={stats.reload} /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} />) : cards.map(([l, v]) => (
            <div key={l} className="panel"><div className="text-sm text-ink-muted">{l}</div><div className="mt-2 text-4xl font-semibold tabular-nums">{v}</div></div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="panel min-w-0 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Threat activity</h2>
          {trends.loading ? <Skeleton h="h-64" /> : trends.error ? <ErrorBox message={trends.error} /> : trends.data.length === 0 ? (
            <Empty title="No activity yet" hint="Analyze an email and its result will appear here." />
          ) : (
            <div className="h-64"><ResponsiveContainer>
              <LineChart data={trends.data}><CartesianGrid stroke="#E5ECE8" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                {Object.entries(COLORS).map(([k, c]) => <Line key={k} type="monotone" dataKey={k} name={k.replace('_', ' ')} stroke={c} strokeWidth={2} dot={false} />)}
              </LineChart>
            </ResponsiveContainer></div>
          )}
        </section>
        <section className="panel min-w-0">
          <h2 className="mb-4 font-semibold">Risk distribution</h2>
          {dist.loading ? <Skeleton h="h-64" /> : dist.error ? <ErrorBox message={dist.error} /> : dist.data.length === 0 ? <Empty title="Nothing to show" hint="No analyses in this period." /> : (
            <div className="h-64"><ResponsiveContainer>
              <PieChart><Pie data={dist.data} dataKey="count" nameKey="category" innerRadius={50} outerRadius={85}>{dist.data.map((d) => <Cell key={d.category} fill={COLORS[d.category]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer></div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="panel min-w-0 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent analysis</h2>
          {recent.loading ? <Skeleton h="h-40" /> : recent.error ? <ErrorBox message={recent.error} /> : recent.data.items.length === 0 ? (
            <Empty title="No analyses yet" hint="Paste an email or upload a .eml file to get started." action={<Link to="/app/analyze" className="btn-primary mt-4">Analyze an email</Link>} />
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <thead className="text-ink-muted"><tr><th className="py-2 pr-4 font-medium">When</th><th className="pr-4 font-medium">Risk</th><th className="pr-4 font-medium">Score</th><th /></tr></thead>
              <tbody>{recent.data.items.map((a) => (
                <tr key={a.id} className="border-t border-line"><td className="py-3 pr-4">{fmt(a.created_at)}</td><td className="pr-4"><RiskBadge value={a.risk_category} /></td><td className="pr-4 tabular-nums">{Math.round(a.risk_score)}</td><td><Link className="text-brand hover:underline" to={`/app/analysis/${a.id}`}>View</Link></td></tr>
              ))}</tbody>
            </table></div>
          )}
        </section>
        <section className="panel min-w-0">
          <h2 className="mb-4 font-semibold">Recent security events</h2>
          {audit.loading ? <Skeleton h="h-40" /> : audit.error ? <ErrorBox message={audit.error} /> : audit.data.length === 0 ? <Empty title="No events" hint="Actions will be recorded here." /> : (
            <ul className="flex flex-col gap-3 text-sm">{audit.data.slice(0, 6).map((e) => (
              <li key={e.id} className="flex justify-between gap-3"><span className="min-w-0 truncate">{e.action}</span><span className="shrink-0 text-xs text-ink-muted">{fmt(e.created_at)}</span></li>
            ))}</ul>
          )}
        </section>
      </div>
    </>
  )
}
