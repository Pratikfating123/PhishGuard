import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { ErrorBox, PageHead, RiskBadge, Skeleton, fmt, useFetch } from './shared'

export default function Result() {
  const { id } = useParams()
  const { data: a, loading, error, reload } = useFetch(`/analysis/${id}`)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Skeleton h="h-96" />
  if (error) return <ErrorBox message={error} retry={reload} />

  const ev = a.evidence || {}
  const observed = (ev.indicators || []).filter((i) => i.kind === 'observed')
  const heuristic = (ev.indicators || []).filter((i) => i.kind !== 'observed')

  const hold = async () => {
    setBusy(true); setMsg('')
    try { await api(`/quarantine/${a.email_id}`, { method: 'POST', body: { reason: `${a.risk_category.replace('_', ' ')} analysis #${a.id}` } }); setMsg('The email is now held in quarantine.') }
    catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHead title="Analysis result" subtitle={`Analysis #${a.id} · ${fmt(a.created_at)}`}>
        <button className="btn-outline" disabled={busy} onClick={hold}>Hold in quarantine</button>
      </PageHead>
      {msg && <p role="status" className="mb-4 rounded-xl bg-brand-mint px-4 py-3 text-sm text-brand-deep">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel lg:col-span-1">
          <RiskBadge value={a.risk_category} />
          <div className="mt-4 text-5xl font-semibold tabular-nums">{Math.round(a.risk_score)}<span className="text-lg text-ink-muted"> / 100</span></div>
          <p className="mt-3 text-sm text-ink-muted">{ev.summary}</p>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-muted">Model classification</dt><dd>{a.classification}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Model version</dt><dd>{a.model_version}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-ink-muted">The score ranks evidence strength. It is not a calibrated probability.</p>
          {!ev.model_available && <p className="mt-3 rounded-xl bg-[#E8EEF5] p-3 text-xs text-[#2A5A8C]">No trained model is loaded. This result uses rule-based checks only.</p>}
        </section>

        <section className="panel lg:col-span-2">
          <h2 className="mb-3 font-semibold">Detected indicators</h2>
          {[['Observed facts', observed], ['Heuristic warnings', heuristic]].map(([t, list]) => (
            <div key={t} className="mb-4"><h3 className="mb-2 text-sm font-medium text-ink-muted">{t}</h3>
              {list.length === 0 ? <p className="text-sm text-ink-muted">None found.</p> : <ul className="list-disc space-y-1.5 pl-5 text-sm">{list.map((i, n) => <li key={n}>{i.text}</li>)}</ul>}
            </div>
          ))}
          <h2 className="mb-3 mt-6 font-semibold">Recommended next steps</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">{(ev.recommended_steps || []).map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
      </div>

      <section className="panel mt-6">
        <h2 className="mb-3 font-semibold">URL analysis</h2>
        {a.urls.length === 0 ? <p className="text-sm text-ink-muted">No links were found in this message.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-ink-muted"><tr><th className="py-2 pr-4 font-medium">URL</th><th className="pr-4 font-medium">Risk</th><th className="font-medium">Flags</th></tr></thead>
            <tbody>{a.urls.map((u, i) => (
              <tr key={i} className="border-t border-line align-top"><td className="max-w-xs break-all py-3 pr-4">{u.url}</td><td className="pr-4 capitalize">{u.risk}</td><td>{u.flags.length ? u.flags.map((f) => f.text).join(' ') : 'No flags'}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      <p className="mt-6 text-sm"><Link to="/app/analyze" className="text-brand hover:underline">Analyze another email</Link></p>
    </>
  )
}
