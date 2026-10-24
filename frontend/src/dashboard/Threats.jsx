import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorBox, PageHead, Pager, RiskBadge, Skeleton, fmt, useFetch } from './shared'

// Threats are analyses rated Suspicious or High Risk. Review-status actions need a backend endpoint (not built yet).
export default function Threats() {
  const [risk, setRisk] = useState('high_risk')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useFetch(`/analysis?risk=${risk}&page=${page}&page_size=15`)
  return (
    <>
      <PageHead title="Threat Detection" subtitle="Analyses rated Suspicious or High Risk." />
      <div className="mb-4">
        <label htmlFor="threat-risk" className="sr-only">Risk filter</label>
        <select id="threat-risk" className="input w-auto" value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1) }}>
          <option value="high_risk">High Risk</option><option value="suspicious">Suspicious</option>
        </select>
      </div>
      <section className="panel">
        {loading ? <Skeleton h="h-48" /> : error ? <ErrorBox message={error} retry={reload} /> : data.items.length === 0 ? <Empty title="No threats in this category" hint="Detected threats will be listed here with their evidence." /> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-ink-muted"><tr><th className="py-2 pr-4 font-medium">Detected</th><th className="pr-4 font-medium">Type</th><th className="pr-4 font-medium">Risk</th><th className="pr-4 font-medium">Indicators</th><th /></tr></thead>
            <tbody>{data.items.map((a) => (
              <tr key={a.id} className="border-t border-line"><td className="py-3 pr-4">{fmt(a.created_at)}</td><td className="pr-4">Phishing</td><td className="pr-4"><RiskBadge value={a.risk_category} /></td><td className="pr-4 tabular-nums">{a.evidence?.indicators?.length ?? 0}</td><td><Link className="text-brand hover:underline" to={`/app/analysis/${a.id}`}>Investigate</Link></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      {data && <Pager page={page} setPage={setPage} hasNext={data.items.length === 15} />}
    </>
  )
}
