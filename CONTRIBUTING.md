# Contributing to Agora

Thank you for helping associations get organized! Bug reports, translations, ideas and code are all welcome.

## Getting started

Requirements: Node.js 20.19+ (22 LTS recommended) and git.

```bash
npm install
```

```bash
npm run setup
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Sign in at http://localhost:3000 with `camille@greencampus.example` / `agora-demo-2026`.

Read [docs/architecture.md](docs/architecture.md) first: it explains how pages, server actions,
permissions and the isolation between associations fit together.

> Agora uses **Next.js 16**, whose APIs differ from older versions (`proxy.ts` instead of middleware,
> Cache Components, async `params`…). The documentation matching the installed version is in
> `node_modules/next/dist/docs/`.

## Before opening a pull request

```bash
npm run format
```

```bash
npm run lint && npm run typecheck && npm test
```

```bash
npm run build && npm run test:e2e
```

The same checks run on GitHub Actions for every pull request.

- Keep pull requests focused on one change and describe what a user will see.
- Add or update tests for behavior changes (unit tests in `tests/unit`, the user journey in `tests/e2e`).
- Every text shown to users must exist in English **and** French (`src/lib/i18n/en.ts` and `fr.ts`).
- Add screenshots for visible changes.
- Mention the change in [CHANGELOG.md](CHANGELOG.md) under "Unreleased".

## Recipes

### Add a page

1. Create `src/app/(app)/my-page/page.tsx`. Start with `const { user, db, association } = await requireContext();`
   and read data with `db` (it only sees the current association).
2. Add texts to `en.ts` and `fr.ts`, then read them with `const { t } = await getI18n();`.
3. Add the link to the sidebar (`src/components/layout/sidebar.tsx`) and to the command palette
   (`src/components/layout/command-palette.tsx`).

### Add a form that changes data

1. Write a server action in `src/actions/<domain>.ts`:

   ```ts
   export async function doSomething(_prev: ActionState, fd: FormData) {
     return withUser(async (ctx) => {
       ensure(can.somePermission(ctx.user), ctx.t);   // permission check, on the server
       const f = reader(fd);
       await assertRefs(ctx, { poleId: f.opt("poleId") }); // ids from the form belong to this association
       await ctx.db.something.create({ data: { … } }); // associationId is added automatically
       return ok(ctx.t.common.saved);
     });
   }
   ```

2. Add the rule to `src/lib/permissions.ts` if needed (and a test in `tests/unit/permissions.test.ts`).
3. Use it from `<FormDialog action={doSomething}>` or `<ActionForm>` (`src/components/forms/`).
4. If others should know, call `logActivity(ctx, …)` and `notify(ctx, …)`.

### Add a database table

1. Edit `prisma/schema.prisma`. If the table belongs to an association, give it an `associationId` and a
   relation to `Association`.
2. Run `npm run db:migrate -- --name add_my_table`, then `npx prisma generate`.
3. Register the model in `src/lib/tenant.ts` (`DIRECT` if it has `associationId`, `VIA` if it belongs to a
   parent). **Forgetting this step lets one association read another's data.**
4. Add it to the backup export (`src/app/api/export/backup/route.ts`) if it holds association data.

### Add a notification type

1. Add the type to `NotificationType` in `src/lib/notifications.ts`.
2. Add its sentence to `notifications.types` in `en.ts` and `fr.ts`.
3. Call `notify(ctx, { userIds, type, data, link })` from the action.

### Add a language

Copy `src/lib/i18n/fr.ts` to a new file (for example `es.ts`), translate it, and register it in
`src/lib/i18n/dictionaries.ts` and `LOCALES` (`src/lib/constants.ts`). Then add its name to `enums.locale`
in every dictionary. TypeScript reports any missing key.

## Code style

- TypeScript everywhere, formatted by Prettier, linted by ESLint (with the React Compiler rules).
- Server code that must never reach the browser imports `server-only`.
- Prefer server components; add `"use client"` only for interactive parts.
- Dates entered by users are "wall time" in UTC; money is stored in cents (see
  [Conventions](docs/architecture.md#conventions)).
- Write comments that explain _why_, not _what_.

## Reporting bugs and ideas

Open an issue with the steps to reproduce, what you expected and what happened, and your browser and
installation method (Node.js or Docker). For security problems, follow [SECURITY.md](SECURITY.md) instead.
