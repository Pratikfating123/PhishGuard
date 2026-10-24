import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { PageHead } from './shared'

export default function Analyze() {
  const nav = useNavigate()
  const [tab, setTab] = useState('paste')
  const [f, setF] = useState({ sender: '', reply_to: '', subject: '', body: '', raw_headers: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (tab === 'paste' && !f.body.trim() && !f.subject.trim()) return setError('Enter an email subject or body to analyze.')
    if (tab === 'upload' && !file) return setError('Choose a .eml file first.')
    if (tab === 'upload' && !file.name.toLowerCase().endsWith('.eml')) return setError('Only .eml files are supported.')
    if (tab === 'upload' && file.size > 5 * 1024 * 1024) return setError('The file is larger than the 5 MB limit.')
    setBusy(true)
    try {
      let body = f
      if (tab === 'upload') {
        const form = new FormData(); form.append('file', file)
        const imported = await api('/emails/import', { method: 'POST', form })
        body = { email_id: imported.id }
      }
      const result = await api('/analyze', { method: 'POST', body })
      nav(`/app/analysis/${result.id}`)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHead title="Analyze Email" subtitle="Paste a message or upload a .eml file. Links are never opened and attachments are never run." />
      <form onSubmit={submit} className="panel max-w-3xl">
        <div role="tablist" className="mb-6 inline-flex rounded-xl bg-brand-soft p-1">
          {[['paste', 'Paste Email'], ['upload', 'Upload .eml']].map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-white shadow-sm' : 'text-ink-muted'}`}>{l}</button>
          ))}
        </div>

        {tab === 'paste' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="sender">Sender address</label><input id="sender" className="input" type="email" value={f.sender} onChange={set('sender')} /></div>
            <div><label className="label" htmlFor="reply_to">Reply-to address (optional)</label><input id="reply_to" className="input" type="email" value={f.reply_to} onChange={set('reply_to')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="subject">Subject</label><input id="subject" className="input" value={f.subject} onChange={set('subject')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="body">Email body</label><textarea id="body" rows={8} className="input" value={f.body} onChange={set('body')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="raw_headers">Raw headers (optional)</label><textarea id="raw_headers" rows={4} className="input font-mono text-xs" value={f.raw_headers} onChange={set('raw_headers')} placeholder="Authentication-Results: …" /></div>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="eml">Email file (.eml, up to 5 MB)</label>
            <input id="eml" type="file" accept=".eml,message/rfc822" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && <p className="mt-2 text-sm text-ink-muted">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl bg-[#FBE6E9] px-4 py-3 text-sm text-[#A12D3B]">{error}</p>}
        <div className="mt-6 flex items-center gap-4">
          <button className="btn-primary" disabled={busy}>{busy ? 'Analyzing…' : 'Analyze Email'}</button>
          {busy && <div className="h-1.5 w-40 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Analysis in progress"><div className="h-full w-1/2 animate-pulse rounded-full bg-brand" /></div>}
        </div>
      </form>
    </>
  )
}
