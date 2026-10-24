import { useAuth } from '../auth'
import { PageHead } from './shared'

// Only what the backend supports is interactive. Everything else is listed honestly as not built yet.
export default function Settings() {
  const { user } = useAuth()
  const todo = ['Password change', 'Notification preferences', 'Risk policy settings (administrators)', 'Mailbox integrations (Gmail, Microsoft 365)']
  return (
    <>
      <PageHead title="Settings" subtitle="Your account details." />
      <section className="panel max-w-2xl">
        <h2 className="mb-4 font-semibold">Profile</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-muted">Name</dt><dd className="mt-1">{user.full_name || 'Not set'}</dd></div>
          <div><dt className="text-ink-muted">Email</dt><dd className="mt-1 break-all">{user.email}</dd></div>
          <div><dt className="text-ink-muted">Role</dt><dd className="mt-1 capitalize">{user.role}</dd></div>
        </dl>
      </section>
      <section className="panel mt-6 max-w-2xl">
        <h2 className="mb-1 font-semibold">Not built yet</h2>
        <p className="mb-3 text-sm text-ink-muted">These need backend endpoints that do not exist in this version.</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">{todo.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
    </>
  )
}
