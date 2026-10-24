import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Empty, ErrorBox, PageHead, Skeleton, fmt, useFetch } from './shared'

export default function Quarantine() {
  const { data, loading, error, reload } = useFetch('/quarantine')
  const [confirm, setConfirm] = useState(null)
  const [msg, setMsg] = useState('')

  const release = async () => {
    try { await api(`/quarantine/${confirm.email_id}/release`, { method: 'POST', body: { confirm: true } }); setMsg('The email was released.'); setConfirm(null); reload() }
    catch (e) { setMsg(e.message); setConfirm(null) }
  }

  return (
    <>
      <PageHead title="Quarantine" subtitle="Held messages stay intact until a person reviews them. Nothing is deleted automatically." />
      {msg && <p role="status" className="mb-4 rounded-xl bg-brand-mint px-4 py-3 text-sm text-brand-deep">{msg}</p>}
      <section className="panel">
        {loading ? <Skeleton h="h-48" /> : error ? <ErrorBox message={error} retry={reload} /> : data.length === 0 ? (
          <Empty title="Quarantine is empty" hint="Hold a suspicious email from its analysis result and it will appear here." />
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-ink-muted"><tr><th className="py-2 pr-4 font-medium">Subject</th><th className="pr-4 font-medium">Reason</th><th className="pr-4 font-medium">Held</th><th className="pr-4 font-medium">Status</th><th /></tr></thead>
            <tbody>{data.map((q) => (
              <tr key={q.email_id + q.created_at} className="border-t border-line">
                <td className="max-w-xs truncate py-3 pr-4">{q.subject || '(no subject)'}</td><td className="pr-4">{q.reason}</td><td className="pr-4">{fmt(q.created_at)}</td>
                <td className="pr-4 capitalize">{q.status}</td>
                <td className="whitespace-nowrap">{q.status === 'held' && <button className="btn-outline px-3 py-1.5" onClick={() => setConfirm(q)}>Release</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      <p className="mt-4 text-sm text-ink-muted">Permanent deletion is not offered here. <Link to="/app/inbox" className="text-brand hover:underline">Open the inbox</Link> to review messages.</p>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="rel-title">
          <div className="panel w-full max-w-md">
            <h2 id="rel-title" className="text-lg font-semibold">Release this email?</h2>
            <p className="mt-2 text-sm text-ink-muted">“{confirm.subject || '(no subject)'}” was held because: {confirm.reason}. Releasing records your name in the audit log.</p>
            <div className="mt-6 flex justify-end gap-3"><button className="btn-outline" onClick={() => setConfirm(null)}>Cancel</button><button className="btn-primary" onClick={release}>Release email</button></div>
          </div>
        </div>
      )}
    </>
  )
}
