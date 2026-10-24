import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth'
import { api } from '../api'

function Shell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-soft px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><ShieldCheck size={20} /></span>PhishGuard AI
        </Link>
        <div className="panel p-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mb-6 mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}

function Password({ id, register, error, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} className="input pr-12" aria-invalid={!!error} {...register} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

function useSubmit(fn) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (data) => {
    setBusy(true); setError('')
    try { await fn(data) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return { error, busy, submit }
}

export function SignIn() {
  const { login } = useAuth()
  const nav = useNavigate()
  const from = useLocation().state?.from || '/app'
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { error, busy, submit } = useSubmit(async (d) => { await login(d); nav(from, { replace: true }) })
  return (
    <Shell title="Sign in" subtitle="Welcome back. Continue to your security overview.">
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
        <Field id="email" label="Email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className="input" {...register('email', { required: 'Enter your email address.' })} />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <Password id="password" autoComplete="current-password" register={register('password', { required: 'Enter your password.' })} />
        </Field>
        {error && <p role="alert" className="rounded-xl bg-[#FBE6E9] px-4 py-3 text-sm text-[#A12D3B]">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <div className="flex justify-between text-sm"><Link to="/forgot-password" className="text-brand hover:underline">Forgot password?</Link><Link to="/signup" className="text-brand hover:underline">Create an account</Link></div>
      </form>
    </Shell>
  )
}

export function SignUp() {
  const { register: signup } = useAuth()
  const nav = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { error, busy, submit } = useSubmit(async (d) => { await signup(d); nav('/app', { replace: true }) })
  return (
    <Shell title="Create your account" subtitle="Start analyzing emails in a private workspace.">
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
        <Field id="full_name" label="Full name" error={errors.full_name?.message}>
          <input id="full_name" autoComplete="name" className="input" {...register('full_name', { required: 'Enter your name.' })} />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className="input" {...register('email', { required: 'Enter your email address.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' } })} />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <Password id="password" autoComplete="new-password" register={register('password', { required: 'Choose a password.', minLength: { value: 10, message: 'Use at least 10 characters.' }, validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Include letters and numbers.' })} />
        </Field>
        {error && <p role="alert" className="rounded-xl bg-[#FBE6E9] px-4 py-3 text-sm text-[#A12D3B]">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center text-sm text-ink-muted">Already registered? <Link to="/signin" className="text-brand hover:underline">Sign in</Link></p>
      </form>
    </Shell>
  )
}

export function ForgotPassword() {
  const [msg, setMsg] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { error, busy, submit } = useSubmit(async (d) => { const r = await api('/auth/forgot-password', { method: 'POST', body: d }); setMsg(r.message) })
  return (
    <Shell title="Reset your password" subtitle="Enter your email and we will send reset instructions if an account exists.">
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
        <Field id="email" label="Email" error={errors.email?.message}>
          <input id="email" type="email" className="input" {...register('email', { required: 'Enter your email address.' })} />
        </Field>
        {msg && <p role="status" className="rounded-xl bg-brand-mint px-4 py-3 text-sm text-brand-deep">{msg}</p>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send instructions'}</button>
        <Link to="/signin" className="text-center text-sm text-brand hover:underline">Back to sign in</Link>
      </form>
    </Shell>
  )
}

export function ResetPassword() {
  return (
    <Shell title="Choose a new password" subtitle="Reset links need an email sender, which is not configured yet.">
      <p className="rounded-xl bg-[#FDF3E1] px-4 py-3 text-sm text-[#6B4208]">The reset endpoint returns 501 until an email sender is set up on the server. See the README, section Password reset.</p>
      <Link to="/signin" className="btn-primary mt-5 w-full">Back to sign in</Link>
    </Shell>
  )
}
