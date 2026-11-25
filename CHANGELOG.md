# Changelog

All notable changes to Agora are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] – 2026-11-25

First public release.

### Founding and organization

- Founding checklist: 16 steps in 6 themes (purpose, statutes, constitutive general assembly, declaration,
  bank account, insurance…), assignable, with due dates and progress.
- Structure page: organization chart, "who does what" table of recurring duties, membership matrix.
- Poles (working groups) with leads, members, projects, tasks, requests and events.

### Working together

- **Requests**: ask a pole for help. The pole's members are notified, one of them takes it and it becomes their
  task; the requester is notified when it is taken and when it is done. Pole leads and managers can give a
  request to someone.
- Projects with lead, team, dates, budget, milestones, progress updates, automatic progress and health, cards and
  timeline views.
- Tasks: kanban board with drag and drop, list view, filters, comments.
- **Votes**: single or multiple choice, anonymous or not, deadline, optionally restricted to a pole.
- **Volunteering**: log time given to the association, totals per member and pole, estimated value, CSV export.
- Events and meetings: calendar, RSVP, agenda and minutes, private calendar feed (iCalendar) for Google,
  Apple and Outlook calendars.
- Announcements, activity feed, global search (Ctrl/⌘ K).

### Money and documents

- Income and expenses, monthly chart, project budgets, membership fees, CSV export.
- Documents: uploaded files and links, by category, served only to members.

### Accounts and associations

- Sign-up, sign-in, password reset by email or by an administrator's link.
- Create an association with a guided wizard, or join one with a **join code** limited in number of uses and
  time, optionally linked to a role and a pole.
- One instance can host several associations; members switch between theirs.
- Roles: administrator, manager, member. Pole and project leads get extra rights.
- Notification center, with optional emails (SMTP).
- Settings: profile, language (English / French), theme and accent color, security (password, active sessions),
  notification preferences.
- Instance settings: `SIGNUP_MODE` (open / invite / closed) and `ALLOW_NEW_ASSOCIATIONS`.

### Security

- Argon2id password hashing, NIST-style password rules, account lockout and rate limits.
- Database sessions with hashed tokens; hashed invitation, reset and calendar tokens.
- Automatic isolation between associations at the database client level, with tests.
- Content Security Policy and security headers, protected file downloads, safe CSV exports.

### Hosting

- Runs with Node.js (`npm run setup`) or Docker (`docker compose up -d`), SQLite database, no other service.
- `npm run db:backup` for consistent backups while running; JSON export of an association for administrators.
- Unit tests (Vitest), end-to-end tests (Playwright) and a GitHub Actions workflow.

> Builds shared before 1.0.0 used a different database schema. If you tried one, delete the `data/` folder and
> run `npm run setup` again.

[Unreleased]: https://github.com/OWNER/agora/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/OWNER/agora/releases/tag/v1.0.0
