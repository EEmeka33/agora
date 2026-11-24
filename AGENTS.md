<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agora — notes for contributors (humans and AI agents)

- **Stack**: Next.js 16 (App Router, Server Actions, Cache Components), React 19, Prisma 7 + SQLite (better-sqlite3 adapter), Tailwind CSS 4.
- **Every page reads the session** through `requireUser()` (src/lib/auth.ts), which calls `connection()`: pages render at request time behind the `<Suspense>` of `src/app/(app)/layout.tsx` and `loading.tsx`.
- **Mutations** are server actions in `src/actions/*`, wrapped with `withUser()` (src/lib/action-utils.ts) which checks the session, catches errors and revalidates. Always check permissions with `can.*` (src/lib/permissions.ts) inside the action.
- **i18n**: every UI string lives in `src/lib/i18n/en.ts` and `fr.ts` (TypeScript forces both to have the same keys). Server: `getI18n()`; client: `useT()`.
- **Enums** are strings validated against `src/lib/constants.ts` (portable between SQLite and PostgreSQL). Colors per status: `src/lib/colors.ts`.
- **Dates** typed by users are stored as "wall time" in UTC and always formatted with `timeZone: "UTC"` (src/lib/utils.ts).
- **Money** is stored in cents (`*Cents` columns).
- Checks: `npm run lint && npm run typecheck && npm test`, end-to-end: `npm run build && npm run test:e2e`.
