import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { Empty, ErrorBox, PageHead, Pager, RiskBadge, Skeleton, fmt, useFetch } from './shared'

export default function Inbox() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [risk, setRisk] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState(null)
  const qs = new URLSearchParams({ page, page_size: 15, ...(q && { q }), ...(risk && { risk }) })
  const list = useFetch(`/emails?${qs}`)
  const detail = useFetch(openId ? `/emails/${openId}` : '/emails?page_size=1', [openId])

  const open = async (e) => {
    setOpenId(e.id)
    if (!e.is_read) { await api(`/emails/${e.id}/read-status`, { method: 'PATCH', body: { is_read: true } }).catch(() => {}); list.reload() }
  }

  return (
    <>
      <PageHead title="Email Inbox" subtitle="Imported and analyzed messages." />
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="inbox-q">Search</label>
        <input id="inbox-q" className="input max-w-sm" placeholder="Search sender or subject" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <label className="sr-only" htmlFor="inbox-risk">Risk filter</label>
        <select id="inbox-risk" className="input w-auto" value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1) }}>
          <option value="">All risk levels</option><option value="high_risk">High Risk</option><option value="suspicious">Suspicious</option><option value="low_risk">Low Risk</option><option value="inconclusive">Inconclusive</option>
        </select>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="panel min-w-0 p-0 lg:col-span-3">
          {list.loading ? <div className="p-6"><Skeleton h="h-48" /></div> : list.error ? <div className="p-6"><ErrorBox message={list.error} retry={list.reload} /></div> : list.data.items.length === 0 ? (
            <div className="p-6"><Empty title="No emails found" hint="Import a .eml file or analyze a pasted email to see it here." /></div>
          ) : (
            <ul>{list.data.items.map((e) => (
              <li key={e.id} className="border-b border-line last:border-0">
                <button onClick={() => open(e)} className={`flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-brand-soft ${openId === e.id ? 'bg-brand-pale' : ''}`}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${e.is_read ? 'bg-transparent' : 'bg-brand'}`} aria-label={e.is_read ? 'Read' : 'Unread'} />
                  <span className="min-w-0 flex-1"><span className={`block truncate text-sm ${e.is_read ? '' : 'font-semibold'}`}>{e.subject || '(no subject)'}</span><span className="block truncate text-xs text-ink-muted">{e.sender} · {fmt(e.received_at)}</span></span>
                  {e.is_quarantined && <span className="chip bg-line text-ink-muted">Quarantined</span>}
                  <RiskBadge value={e.risk_category} />
                </button>
              </li>
            ))}</ul>
          )}
        </section>
        <aside className="panel min-w-0 lg:col-span-2" aria-live="polite">
          {!openId ? <p className="text-sm text-ink-muted">Select a message to read it.</p> : detail.loading ? <Skeleton h="h-48" /> : detail.error ? <ErrorBox message={detail.error} /> : (
            <>
              <h2 className="font-semibold">{detail.data.subject || '(no subject)'}</h2>
              <p className="mt-1 break-all text-xs text-ink-muted">From {detail.data.sender}{detail.data.reply_to && ` · Reply-To ${detail.data.reply_to}`}</p>
              {/* Rendered as plain text. Email HTML is never injected into the page. */}
              <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-brand-soft p-4 text-sm">{detail.data.safe_body}</pre>
            </>
          )}
        </aside>
      </div>
      {list.data && <Pager page={page} setPage={setPage} hasNext={page * 15 < list.data.total} />}
    </>
  )
}
