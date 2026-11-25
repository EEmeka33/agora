# Security

Agora stores personal data about association members (names, emails, phone numbers, money, documents).
This page explains how it is protected and how to report a problem.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Use GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
(Security tab → Report a vulnerability) on this repository. Include the steps to reproduce and the
version (or commit) you tested. You should receive an answer within a week.

## Supported versions

Only the latest release receives security fixes. Update regularly (see
[Updating](docs/self-hosting.md#updating)).

## How Agora protects data

### Accounts and passwords

- Passwords are hashed with **Argon2id** (19 MiB memory, 2 iterations: OWASP recommendation). They are never
  stored, logged or exported in clear text.
- Password rules follow NIST SP 800-63B: at least **10 characters**, no maximum complexity rules, common
  passwords and passwords containing the person's email name are refused.
- **Account lockout**: 5 wrong passwords lock the account for 15 minutes. Sign-in, sign-up, password reset
  and join-code attempts are also rate-limited per IP address and per email.
- Sign-in always takes the same time whether the email exists or not, and error messages do not reveal it.
  "Forgot password" answers the same way for every address.
- Changing the password signs the account out of all other devices.

### Sessions

- A session is a random 256-bit token in an `httpOnly`, `SameSite=Lax` cookie (`Secure` with
  `SECURE_COOKIES=true`). Only its **SHA-256 hash** is stored, so a copy of the database cannot be used to
  sign in.
- Sessions expire after 30 days without use, and can be revoked from Settings → Security.

### Links and codes

- Invitation links, password reset links and calendar feed addresses contain random 256-bit tokens; only
  their hashes are stored. Reset links are valid for one hour; invitation and reset links work only once.
- Join codes are random (32¹⁰ ≈ 10¹⁵ combinations), limited in number of uses and optionally in time, and
  can be revoked at any moment. Managers can only create codes for the member role; codes giving the manager
  or administrator role can only be created by administrators.

### Isolation between associations

One Agora can host several associations. Every database query made on behalf of a member goes through a
client that is automatically restricted to the current association, and ids received from forms are checked
to belong to it. See [Isolation between associations](docs/architecture.md#isolation-between-associations).
This is covered by unit and end-to-end tests.

### Access control

- Every page, server action and API route checks the session against the database and the member's role.
  Hidden buttons are never the only protection.
- Uploaded files are stored under random names outside the public folder, and are only served to active
  members of the document's association, with `Content-Security-Policy: sandbox` and `nosniff`.
- The member list export (emails, phone numbers) is restricted to managers and administrators, and the full
  JSON backup to administrators. It never contains password hashes, session tokens or other secrets.
  Transactions and volunteering time, which every member can see in Agora, can be exported by every member.

### Web protections

- Content Security Policy, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, permissions policy.
- Server actions are protected against cross-site requests by Next.js; API routes that change data check
  the `Origin` header.
- CSV exports neutralize spreadsheet formulas (`=`, `+`, `-`, `@`).
- All user content is escaped by React; no HTML from users is rendered.

### Data on disk

- `npm run setup` creates the `data/` folder readable only by its owner. Docker stores it in a volume.
- The database and backups contain personal data: keep them on an encrypted disk and limit who can access
  the server.

## Recommendations for administrators

- Serve Agora over **HTTPS** only and set `SECURE_COOKIES="true"` (see
  [self-hosting](docs/self-hosting.md#putting-it-on-the-internet-https)).
- On a public server, use `SIGNUP_MODE="invite"` and, for a single association,
  `ALLOW_NEW_ASSOCIATIONS="false"`.
- Give join codes a small number of uses and an expiry date; revoke them when they are no longer needed.
- Keep the number of administrators small.
- Back up regularly with `npm run db:backup` and test a restore from time to time.
- Keep Agora and Node.js up to date.

## Known limits

- Rate limits are kept in memory: they reset when Agora restarts and are not shared between several
  instances (the account lockout is stored in the database and is not affected).
- There is no two-factor authentication yet.
- Like most sites, the sign-up form says when an email address already has an account (sign-in and
  "Forgot password" do not).
- The CSP allows inline scripts, which Next.js needs for hydration without a nonce.
