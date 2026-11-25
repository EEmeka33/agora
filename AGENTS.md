<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agora — notes for contributors (humans and AI agents)

Read `docs/architecture.md` for the full picture. The essentials:

- **Stack**: Next.js 16 (App Router, Server Actions, Cache Components), React 19, Prisma 7 + SQLite (better-sqlite3 adapter), Tailwind CSS 4, Argon2id.
- **Accounts vs associations**: a `User` is a global account; `Member` links it to an association with a role. Sessions are DB rows (`Session`, token hashed with SHA-256) — see `src/lib/auth.ts`.
- **Pages** call `requireContext()` (`src/lib/context.ts`), which returns `{ user, association, db, associations }` and redirects to /login or /welcome. It calls `connection()`, so pages render at request time behind the `<Suspense>` of `src/app/(app)/layout.tsx` and `loading.tsx`. Pages that only need an account use `requireAccount()`.
- **Always query through `ctx.db`** (the tenant client from `src/lib/tenant.ts`): it adds `associationId` to filters and creates automatically. The global `db` (`src/lib/db.ts`) is only for accounts, sessions, notifications, join codes and the calendar feed. **A new model that belongs to an association must be added to `DIRECT` or `VIA` in `tenant.ts`.**
- **Mutations** are server actions in `src/actions/*`, wrapped with `withUser()` (or `withAccount()` for account-level actions) from `src/lib/action-utils.ts`. Check permissions with `ensure(can.*(...), t)` (`src/lib/permissions.ts`) and validate ids received from forms with `assertRefs(ctx, {...})`.
- **Notifications**: `notify(ctx, { userIds, type, data, link })` in `src/lib/notifications.ts`; texts are rendered from the dictionaries (`notifications.types`), emails are sent with `after()` when `SMTP_URL` is set. Log visible changes with `logActivity()`.
- **i18n**: every UI string lives in `src/lib/i18n/en.ts` and `fr.ts` (TypeScript forces both to have the same keys). Server: `getI18n()`; client: `useT()`.
- **Enums** are strings validated against `src/lib/constants.ts` (portable between SQLite and PostgreSQL). Colors per status: `src/lib/colors.ts`.
- **Dates** typed by users are stored as "wall time" in UTC and always formatted with `timeZone: "UTC"` (src/lib/utils.ts).
- **Money** is stored in cents (`*Cents` columns).
- **Schema changes**: `npm run db:migrate -- --name x` then `npx prisma generate` (Prisma 7's `migrate dev` does not regenerate the client).
- **Checks**: `npm run format && npm run lint && npm run typecheck && npm test`; end-to-end: `npm run build && npm run test:e2e` (Next.js keeps hidden routes mounted: e2e selectors must target visible elements).
