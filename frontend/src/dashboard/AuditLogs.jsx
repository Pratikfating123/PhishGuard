import { useState } from 'react'
import { Empty, ErrorBox, PageHead, Pager, Skeleton, fmt, useFetch } from './shared'

export default function AuditLogs() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useFetch(`/audit-logs?page=${page}`)
  return (
    <>
      <PageHead title="Audit Logs" subtitle="A record of important actions. Passwords and message contents are never logged." />
      <section className="panel">
        {loading ? <Skeleton h="h-48" /> : error ? <ErrorBox message={error} retry={reload} /> : data.length === 0 ? <Empty title="No audit events" hint="Actions such as sign-ins, analyses and releases are recorded here." /> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-ink-muted"><tr><th className="py-2 pr-4 font-medium">Time</th><th className="pr-4 font-medium">User</th><th className="pr-4 font-medium">Action</th><th className="pr-4 font-medium">Target</th><th className="font-medium">Result</th></tr></thead>
            <tbody>{data.map((e) => (
              <tr key={e.id} className="border-t border-line"><td className="whitespace-nowrap py-3 pr-4">{fmt(e.created_at)}</td><td className="pr-4">{e.user_id ?? '—'}</td><td className="pr-4">{e.action}</td><td className="pr-4">{e.target}</td><td className={e.result === 'failure' ? 'text-danger' : ''}>{e.result}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      {data && <Pager page={page} setPage={setPage} hasNext={data.length === 50} />}
    </>
  )
}
