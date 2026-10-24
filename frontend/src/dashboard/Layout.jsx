import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, ClipboardList, FileBarChart, Inbox, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ScanSearch, Settings, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../auth'

const ITEMS = [
  ['/app', 'Overview', LayoutDashboard, true],
  ['/app/inbox', 'Email Inbox', Inbox],
  ['/app/analyze', 'Analyze Email', ScanSearch],
  ['/app/threats', 'Threat Detection', ShieldAlert],
  ['/app/quarantine', 'Quarantine', ShieldCheck],
  ['/app/reports', 'Reports', FileBarChart],
  ['/app/audit', 'Audit Logs', ClipboardList],
  ['/app/settings', 'Settings', Settings],
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [q, setQ] = useState('')

  const links = (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {ITEMS.map(([to, label, Icon, end]) => (
        <NavLink key={to} to={to} end={end} onClick={() => setMobile(false)} title={label}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${isActive ? 'bg-brand text-white' : 'text-ink-muted hover:bg-brand-mint hover:text-brand-deep'}`}>
          <Icon size={19} className="shrink-0" />{(!collapsed || mobile) && label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-brand-soft">
      <aside className={`hidden shrink-0 flex-col gap-6 border-r border-line bg-white p-4 transition-all md:flex ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 font-bold"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white"><ShieldCheck size={20} /></span>{!collapsed && 'PhishGuard AI'}</span>
        </div>
        {links}
        <button className="mt-auto flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-ink-muted hover:bg-brand-mint" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={19} /> : <><PanelLeftClose size={19} />Collapse</>}
        </button>
      </aside>

      {mobile && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-black/30" aria-label="Close menu" onClick={() => setMobile(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-white p-4">
            <div className="flex items-center justify-between"><span className="font-bold">PhishGuard AI</span><button aria-label="Close menu" onClick={() => setMobile(false)}><X size={20} /></button></div>
            {links}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
          <button className="grid h-11 w-11 place-items-center rounded-xl border border-line md:hidden" aria-label="Open menu" onClick={() => setMobile(true)}><Menu size={20} /></button>
          <form className="min-w-0 flex-1" onSubmit={(e) => { e.preventDefault(); nav(`/app/inbox?q=${encodeURIComponent(q)}`) }} role="search">
            <label htmlFor="global-search" className="sr-only">Search emails</label>
            <input id="global-search" className="input max-w-md" placeholder="Search emails by sender or subject" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <button className="grid h-11 w-11 place-items-center rounded-xl border border-line" aria-label="Notifications" onClick={() => nav('/app/threats')}><Bell size={19} /></button>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block"><div className="font-semibold">{user.full_name || user.email}</div><div className="text-xs text-ink-muted">{user.role === 'admin' ? 'Administrator' : 'Member'}</div></div>
            <button className="btn-outline px-3 py-2.5" onClick={async () => { await logout(); nav('/') }} aria-label="Sign out"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
