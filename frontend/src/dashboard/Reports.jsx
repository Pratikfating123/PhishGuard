import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api'
import { Empty, ErrorBox, PageHead, Skeleton, useFetch } from './shared'

export default function Reports() {
  const [days, setDays] = useState(30)
  const trends = useFetch(`/dashboard/trends?days=${days}`)
  const [error, setError] = useState('')

  const download = async () => {
    setError('')
    try {
      const csv = await api(`/reports/export?days=${days}`)
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const a = Object.assign(document.createElement('a'), { href: url, download: 'phishguard-report.csv' })
      a.click(); URL.revokeObjectURL(url)
    } catch (e) { setError(e.message) }
  }

  return (
    <>
      <PageHead title="Reports" subtitle="Analysis volume and threat trends for your account.">
        <div className="flex gap-3">
          <label htmlFor="rep-range" className="sr-only">Date range</label>
          <select id="rep-range" className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>
          <button className="btn-primary" onClick={download}>Export CSV</button>
        </div>
      </PageHead>
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      <section className="panel">
        <h2 className="mb-4 font-semibold">Analyses by day and risk</h2>
        {trends.loading ? <Skeleton h="h-64" /> : trends.error ? <ErrorBox message={trends.error} retry={trends.reload} /> : trends.data.length === 0 ? <Empty title="No data for this period" hint="Run some analyses, then return to see trends." /> : (
          <div className="h-72"><ResponsiveContainer><BarChart data={trends.data}><CartesianGrid stroke="#E5ECE8" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip />
            <Bar dataKey="low_risk" stackId="a" fill="#26815F" name="low risk" /><Bar dataKey="suspicious" stackId="a" fill="#D99227" /><Bar dataKey="high_risk" stackId="a" fill="#C83D4D" name="high risk" /><Bar dataKey="inconclusive" stackId="a" fill="#3478B9" />
          </BarChart></ResponsiveContainer></div>
        )}
      </section>
      <p className="mt-4 text-sm text-ink-muted">False-positive and false-negative rates appear only after you evaluate the model on labeled data. See the evaluation template in the docs folder.</p>
    </>
  )
}
