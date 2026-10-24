import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Check, ChevronDown, Inbox, Layers, Link2, Lock, Menu, Plug, ScanSearch, ShieldCheck, Upload, X, Eye } from 'lucide-react'

const NAV = [['Features', '#features'], ['How It Works', '#how'], ['Security', '#security'], ['Pricing', '#pricing'], ['FAQ', '#faq']]

const FEATURES = [
  [ScanSearch, 'AI Phishing Detection', 'Analyze email text, spot urgent language and social engineering patterns, and get a risk category with the evidence behind it.'],
  [Link2, 'Intelligent URL Analysis', 'Extract every link, inspect hostname and domain structure, and flag suspicious patterns. Optional threat-intelligence feeds can be added.'],
  [Inbox, 'Secure Email Management', 'Organize imported emails, search and filter them, review suspicious messages, and manage quarantine and release.'],
  [BarChart3, 'Security Analytics', 'Review detected threats, see how risk is distributed, track detection history, and export reports you are authorized to see.'],
]
const STEPS = [
  [Upload, 'Import', 'Upload a supported .eml file or submit an email through an authorized integration.'],
  [ScanSearch, 'Analyze', 'Extract message text, URLs, sender details and available email authentication signals.'],
  [Layers, 'Assess', 'Combine the model prediction and security indicators into one risk assessment.'],
  [ShieldCheck, 'Protect', 'Show the verdict and apply the warning or quarantine actions you configured.'],
]
const BENEFITS = [
  [Eye, 'Explainable Security Decisions', 'Each verdict lists the indicators behind it, separating observed facts from heuristic warnings.'],
  [Lock, 'Secure Data Handling', 'Per-user access, hashed passwords, sanitized email HTML and append-only audit records.'],
  [BarChart3, 'Centralized Threat Visibility', 'Threats, quarantine and reports in one workspace instead of scattered inboxes.'],
  [Plug, 'Flexible Integration', 'A REST API and an optional mailbox connection that stays off until you configure it.'],
]
const STATS = [['8', 'analysis stages from parsing to saved result'], ['4', 'risk verdicts: Low Risk, Suspicious, High Risk, Inconclusive'], ['0', 'links opened or attachments run during analysis'], ['.eml', 'upload format, plus pasted text and headers']]
const FAQ = [
  ['What is phishing detection?', 'Phishing detection identifies emails that try to trick a person into revealing credentials, making a payment or running malicious software. It combines language analysis, link inspection and sender checks to flag messages that deserve a closer look.'],
  ['How does the AI analyze an email?', 'The platform extracts the message text, links, sender details and available authentication headers. A text classifier produces a prediction, separate heuristics check links and sender signals, and both feed one risk assessment with the evidence shown.'],
  ['Can the system detect suspicious URLs?', 'Yes. Links are extracted and inspected for hostname structure, look-alike patterns and other suspicious traits. Links are never opened or visited during routine analysis.'],
  ['Does the application guarantee that every email is safe?', 'No. No detection system is perfect. A result is an assessment that helps you decide, and a low-risk verdict does not prove a message is safe.'],
  ['Can I upload .eml files?', 'Yes. You can upload a .eml file or paste the sender, subject, body and optional headers. Files are checked for type and size, parsed on the server, and attachments are never executed.'],
  ['How is sensitive email information protected?', 'Access is limited to the account that imported a message, passwords are stored hashed, and untrusted email HTML is sanitized before display. Audit logs record actions without storing passwords or message secrets.'],
  ['Can I connect Gmail or Microsoft 365?', 'Mailbox integrations are designed to be optional and are off until configured. They would use OAuth with the minimum permissions required, and never ask for your mailbox password.'],
  ['What happens when an email is marked high risk?', 'The message is flagged with its evidence and can be held in quarantine for review. Nothing is deleted automatically. A person with the right permission decides whether to release it.'],
]

const Eyebrow = ({ children }) => <span className="inline-block self-start rounded-full bg-brand-mint px-3 py-1.5 text-xs font-semibold tracking-wider text-brand-deep">{children}</span>
const Tick = ({ light }) => <Check size={18} className={`mt-0.5 shrink-0 ${light ? 'text-white' : 'text-success'}`} aria-hidden />
const Logo = ({ light }) => (
  <span className="flex items-center gap-2.5 text-lg font-bold">
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? 'bg-white text-brand' : 'bg-brand text-white'}`}><ShieldCheck size={20} /></span>PhishGuard AI
  </span>
)

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <a href="#top" aria-label="PhishGuard AI home"><Logo /></a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map(([l, h]) => <a key={h} href={h} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted hover:bg-brand-mint hover:text-brand-deep">{l}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/signin" className="hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-brand-pale md:block">Sign In</Link>
          <Link to="/signup" className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep md:block">Get Started</Link>
          <button className="grid h-11 w-11 place-items-center rounded-xl border border-line md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="flex flex-col gap-1 border-t border-line px-4 pb-5 pt-3 md:hidden">
          {NAV.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3.5 text-sm font-medium hover:bg-brand-mint">{l}</a>)}
          <div className="mt-2 flex gap-2">
            <Link to="/signin" className="btn-outline flex-1 rounded-full">Sign In</Link>
            <Link to="/signup" className="btn-primary flex-1 rounded-full">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="mx-auto flex max-w-6xl flex-wrap items-center gap-14 px-4 pb-16 pt-16 sm:px-6 lg:pt-20">
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
        <Eyebrow>AI-POWERED EMAIL SECURITY</Eyebrow>
        <h1 className="text-balance text-5xl font-semibold leading-[1.06] tracking-tight lg:text-6xl">Your inbox deserves intelligent protection.</h1>
        <p className="max-w-lg text-[17px] leading-relaxed text-ink-muted">Detect phishing attempts, investigate suspicious links, and manage email threats with an intelligent security platform designed for modern teams.</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/app/analyze" className="btn-primary px-6 py-4">Analyze an Email</Link>
          <Link to="/app" className="btn-outline px-6 py-4">Explore Dashboard</Link>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted">
          {['AI-assisted threat detection', 'Explainable risk indicators', 'Secure email handling'].map((t) => <li key={t} className="flex items-center gap-2"><Check size={18} className="text-success" />{t}</li>)}
        </ul>
      </div>
      <div className="flex min-w-0 flex-[1_1_420px] justify-center">
        <div className="relative w-full max-w-lg rounded-[28px] bg-brand-mint px-6 pb-14 pt-8">
          <div className="space-y-3.5 rounded-2xl bg-white p-5 shadow-lg shadow-brand-deep/10">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-pale font-bold text-brand">S</span>
              <div className="min-w-0 flex-1"><div className="text-sm font-semibold">Account Security Team</div><div className="break-all text-xs text-ink-muted">support@secure-acc0unt-verify.com</div></div>
              <span className="chip bg-[#FBE6E9] text-[#A12D3B]">High Risk</span>
            </div>
            <div className="font-semibold">Urgent: verify your account within 24 hours</div>
            <p className="text-[13px] leading-relaxed text-ink-muted">We noticed unusual sign-in activity. Confirm your password now or your access will be suspended.</p>
            <div className="flex items-center gap-2 break-all rounded-xl border border-[#F1D9A8] bg-[#FDF3E1] px-3 py-2.5 text-xs text-[#6B4208]"><Link2 size={16} className="shrink-0" />http://secure-acc0unt-verify.com/login</div>
          </div>
          <div className="absolute -bottom-4 left-4 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] text-ink-muted">Illustrative example, not a real email</div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0)
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-brand px-8 py-12 text-white">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(([v, l]) => <div key={l} className="border-l border-white/25 pl-5"><div className="text-4xl font-medium tracking-tight">{v}</div><div className="mt-1.5 text-sm text-[#CFE8E2]">{l}</div></div>)}
          </div>
          <p className="mt-7 text-xs text-[#CFE8E2]">These describe what the product does. Detection accuracy is reported only after you run your own evaluation.</p>
        </div>
      </section>

      <section id="features" className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-24 sm:px-6">
        <div className="flex flex-col items-center gap-3.5 text-center"><Eyebrow>CORE FEATURES</Eyebrow><h2 className="max-w-xl text-balance text-4xl font-semibold tracking-tight">Everything you need to secure your inbox.</h2></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([Icon, t, b]) => (
            <article key={t} className="rounded-card border border-line bg-brand-soft p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/10">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white"><Icon size={24} strokeWidth={1.8} /></span>
              <h3 className="mb-2 text-lg font-semibold">{t}</h3><p className="text-sm leading-relaxed text-ink-muted">{b}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-24 sm:px-6">
        <div className="flex flex-col items-center gap-3.5 text-center"><Eyebrow>HOW IT WORKS</Eyebrow><h2 className="max-w-xl text-balance text-4xl font-semibold tracking-tight">From a raw email to a clear verdict.</h2></div>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([Icon, t, b], i) => (
            <li key={t} className="flex flex-col gap-3.5">
              <div className="flex items-center"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-white"><Icon size={24} strokeWidth={1.8} /></span>{i < 3 && <span className="ml-2 hidden h-0.5 flex-1 bg-[#CFE3D3] lg:block" />}</div>
              <h3 className="text-lg font-semibold">{t}</h3><p className="text-sm leading-relaxed text-ink-muted">{b}</p>
            </li>
          ))}
        </ol>
        <p className="text-center text-sm text-ink-muted">A model classification is an assessment, not proof that an email is safe or malicious.</p>
      </section>

      <section id="security" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap gap-12 rounded-[28px] bg-brand-pale px-8 py-14 sm:px-10">
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-4">
            <h2 className="text-balance text-4xl font-semibold tracking-tight">A security tool you can reason about.</h2>
            <p className="max-w-sm text-[15px] leading-relaxed text-ink-muted">Every verdict shows its evidence, and every action is attributed. No black boxes, no guaranteed outcomes.</p>
          </div>
          <div className="grid min-w-0 flex-[2_1_440px] gap-6 sm:grid-cols-2">
            {BENEFITS.map(([Icon, t, b]) => <div key={t} className="flex flex-col gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-mint text-brand"><Icon size={20} /></span><h3 className="font-semibold">{t}</h3><p className="text-sm leading-relaxed text-ink-muted">{b}</p></div>)}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-24 sm:px-6">
        <div className="flex flex-col items-center gap-3.5 text-center"><Eyebrow>PRICING</Eyebrow><h2 className="text-balance text-4xl font-semibold tracking-tight">Start with a demo. Scale with your team.</h2><p className="max-w-lg text-[15px] text-ink-muted">Pricing is not set yet. Try the free demo, or contact us about a team deployment.</p></div>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex min-w-0 max-w-md flex-[1_1_320px] flex-col gap-5 rounded-3xl border border-line p-9">
            <div><div className="font-semibold">Personal</div><div className="mt-1.5 text-sm text-ink-muted">For individuals checking their own inbox.</div></div>
            <div className="text-4xl font-semibold tracking-tight">Free Demo</div>
            <ul className="flex flex-col gap-3 text-sm">{['Email analysis', 'Basic risk indicators', 'Limited analysis history', 'Individual dashboard'].map((x) => <li key={x} className="flex gap-2.5"><Tick />{x}</li>)}</ul>
            <Link to="/signup" className="btn-primary mt-auto py-4">Try the demo</Link>
          </div>
          <div className="flex min-w-0 max-w-md flex-[1_1_320px] flex-col gap-5 rounded-3xl bg-brand p-9 text-white">
            <div><div className="font-semibold">Business</div><div className="mt-1.5 text-sm text-[#CFE8E2]">For teams that need shared visibility and control.</div></div>
            <div className="text-4xl font-semibold tracking-tight">Contact for Pricing</div>
            <ul className="flex flex-col gap-3 text-sm text-brand-mint">{['Team-oriented security dashboard', 'Quarantine workflows', 'Audit history', 'Advanced reporting', 'Integration-ready architecture'].map((x) => <li key={x} className="flex gap-2.5"><Tick light />{x}</li>)}</ul>
            <Link to="/signup" className="btn mt-auto bg-white py-4 text-brand-deep hover:bg-brand-mint">Contact us</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto flex max-w-3xl flex-col gap-9 px-4 pt-24 sm:px-6">
        <h2 className="text-center text-4xl font-semibold tracking-tight">Frequently asked questions</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="overflow-hidden rounded-2xl border border-line bg-brand-soft">
              <h3>
                <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold hover:bg-white" aria-expanded={openFaq === i} aria-controls={`faq-${i}`} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  {q}<ChevronDown size={20} className={`shrink-0 text-brand transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
              </h3>
              {openFaq === i && <p id={`faq-${i}`} className="px-5 pb-5 text-sm leading-7 text-ink-muted">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-10 rounded-[28px] bg-brand-mint px-8 py-14 sm:px-10">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <h2 className="text-balance text-4xl font-semibold tracking-tight">Make every email a more informed decision.</h2>
            <p className="max-w-md text-base leading-relaxed text-[#41524E]">Explore intelligent email analysis and bring your security activity into one clear workspace.</p>
            <div className="flex flex-wrap gap-3"><Link to="/app/analyze" className="btn-primary px-6 py-4">Start Analyzing</Link><Link to="/app" className="btn bg-white px-6 py-4 text-brand-deep hover:bg-white/70">View Security Dashboard</Link></div>
          </div>
        </div>
      </section>

      <footer className="bg-brand-deep text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-7 pt-16 sm:px-6">
          <div className="flex flex-wrap justify-between gap-12">
            <div className="max-w-xs"><Logo light /><p className="mt-4 text-sm leading-relaxed text-[#CFE8E2]">Think before you click. Let AI protect your inbox.</p></div>
            <div className="flex flex-wrap gap-12 text-sm">
              <div className="flex flex-col gap-3"><div className="font-semibold">Product</div>{NAV.slice(0, 4).map(([l, h]) => <a key={h} href={h} className="text-[#CFE8E2] hover:text-white">{l}</a>)}</div>
              <div className="flex flex-col gap-3"><div className="font-semibold">Account</div><Link to="/signin" className="text-[#CFE8E2] hover:text-white">Sign In</Link><Link to="/signup" className="text-[#CFE8E2] hover:text-white">Sign Up</Link></div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-5 text-[13px] text-[#CFE8E2]">© 2026 PhishGuard AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
