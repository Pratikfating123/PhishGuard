# Security and privacy notes

## Implemented

- Argon2id password hashing (argon2-cffi defaults)
- HttpOnly + SameSite session cookie, `Secure` via `COOKIE_SECURE=true` behind HTTPS
- CSRF double-submit token on state-changing requests
- Server-side ownership checks on all email, analysis and quarantine access
- Parameterized queries through SQLAlchemy; search input length-capped
- Upload checks: `.eml` extension, 5 MB cap, parse errors returned as 422; attachments are recorded as metadata and never executed or stored
- URLs are parsed as strings and never requested
- Email text is shown in a `<pre>` as plain text; the API also returns an `nh3`-stripped copy. If you add HTML rendering, sanitize with nh3 and show it in a sandboxed iframe with no scripts and no remote content
- Release requires `confirm: true` and writes an audit record; nothing is auto-deleted
- Audit log is insert-only from application code; passwords, tokens and message bodies are not logged
- Generic 500 responses; security headers (nosniff, frame deny, no-referrer); CORS limited to configured origins
- Login, registration, forgot-password and analyze are rate limited (in memory, per process)

## Not implemented, do before production

- Email sender for password reset
- Distributed rate limiting; account lockout
- Database-level insert-only permission on `audit_logs` (grant INSERT and SELECT only)
- Retention policy and scheduled purge of stored message bodies
- Encrypted storage for mailbox OAuth tokens (integrations are off by default)
- Dependency scanning and a secrets manager
- Verification that SPF/DKIM/DMARC headers come from your own receiving server; headers pasted by a user can be forged

## Privacy

Message bodies are stored per user in the database. Decide how long to keep them before real mail goes in.
