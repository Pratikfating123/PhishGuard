import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

export const RISK = {
  low_risk: { label: 'Low Risk', cls: 'bg-[#E3F2EA] text-[#1D6A4C]' },
  suspicious: { label: 'Suspicious', cls: 'bg-[#FDF3E1] text-[#6B4208]' },
  high_risk: { label: 'High Risk', cls: 'bg-[#FBE6E9] text-[#A12D3B]' },
  inconclusive: { label: 'Inconclusive', cls: 'bg-[#E8EEF5] text-[#2A5A8C]' },
}

export function RiskBadge({ value }) {
  if (!value) return <span className="chip bg-line text-ink-muted">Not analyzed</span>
  const r = RISK[value] || RISK.inconclusive
  return <span className={`chip ${r.cls}`}>{r.label}</span>
}

export function useFetch(path, deps = []) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    api(path).then((data) => setState({ data, error: '', loading: false })).catch((e) => setState({ data: null, error: e.message, loading: false }))
  }, [path]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: load }
}

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}</div>
      {children}
    </div>
  )
}

export const Skeleton = ({ h = 'h-24' }) => <div className={`${h} animate-pulse rounded-2xl bg-line/60`} />
export const ErrorBox = ({ message, retry }) => (
  <div role="alert" className="rounded-2xl border border-[#F3C7CD] bg-[#FBE6E9] p-5 text-sm text-[#A12D3B]">
    {message} {retry && <button className="font-semibold underline" onClick={retry}>Try again</button>}
  </div>
)
export const Empty = ({ title, hint, action }) => (
  <div className="rounded-2xl border border-dashed border-line bg-brand-soft p-10 text-center">
    <div className="font-semibold">{title}</div><p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-muted">{hint}</p>{action}
  </div>
)
export const fmt = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '')

export function Pager({ page, setPage, hasNext }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <button className="btn-outline px-4 py-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
      <span className="text-ink-muted">Page {page}</span>
      <button className="btn-outline px-4 py-2" disabled={!hasNext} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  )
}
