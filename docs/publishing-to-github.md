# Publishing Agora to GitHub

This repository is ready to be pushed: it has a git history, a `.gitignore` that keeps the database, the
uploads and `.env` out of git, a CI workflow, issue and pull request templates, and the documentation.

## 1. Before the first push

1. **Choose a license** and add a `LICENSE` file at the root. Without a license, others may look at the code
   but are not allowed to reuse it.

   | License                                                   | In short                                                                                                                     |
   | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
   | [MIT](https://choosealicense.com/licenses/mit/)           | Anyone can reuse the code, even in closed products. Simple and common                                                        |
   | [AGPL-3.0](https://choosealicense.com/licenses/agpl-3.0/) | Anyone who distributes or **hosts** a modified version must publish their changes. Used by Paheko and many self-hosted tools |

   GitHub can create the file for you: on the repository page, **Add file → Create new file**, name it
   `LICENSE`, then **Choose a license template**. Then update the "License" section of the README.

2. **Check that no private data is committed**:

   ```bash
   git status --ignored
   ```

   `data/`, `.env` and `backups/` must be listed under "Ignored files". The demo data in `prisma/seed.ts` is
   fictitious (`*.example` addresses).

3. **Replace the `OWNER` placeholder** with your GitHub account (or organization) name in `CHANGELOG.md`
   and `.github/ISSUE_TEMPLATE/config.yml`, and `<you>` in `docs/self-hosting.md`:

   ```bash
   grep -rn "OWNER\|<you>" --include=*.md --include=*.yml .  --exclude-dir=node_modules
   ```

4. Optional: **sign the commits with your name**. The existing commits have a generic author. To rewrite
   them with your git identity (do this only before the first push):

   ```bash
   git rebase -r --root --exec "git commit --amend --no-edit --reset-author"
   ```

## 2. Create the repository and push

### With the GitHub website

1. Go to https://github.com/new, choose a name (for example `agora`), and leave **"Add a README"**,
   **".gitignore"** and **"license"** unchecked (the repository must be empty).
2. In the project folder:

   ```bash
   git remote add origin https://github.com/<your-account>/agora.git
   ```

   ```bash
   git push -u origin main
   ```

### With the GitHub CLI

```bash
gh repo create agora --private --source . --push
```

Use `--public` instead of `--private` to make it public directly.

## 3. After the push

- **Actions** tab: the CI workflow (`.github/workflows/ci.yml`) runs formatting, lint, type checking, unit
  tests, a production build and the end-to-end tests on every push to `main` and every pull request.
- **About** (gear icon on the repository page): add a description, for example
  _"Self-hosted workspace to found and run an association: poles, requests, projects, votes, events, finance"_,
  and topics such as `association`, `nonprofit`, `self-hosted`, `nextjs`, `sqlite`.
- **Settings → Code security**: enable _Private vulnerability reporting_ (used by [SECURITY.md](../SECURITY.md))
  and _Dependabot alerts_.
- **Settings → Branches**: optionally protect `main` and require the CI check before merging.
- The screenshots in `docs/screenshots/` are displayed by the README.

## 4. Day-to-day work

```bash
git switch -c my-feature
```

Make your changes, then:

```bash
npm run format && npm run lint && npm run typecheck && npm test
```

```bash
git add -A && git commit -m "Describe the change"
```

```bash
git push -u origin my-feature
```

Open a pull request on GitHub, wait for the CI check, then merge.

## 5. Publishing a release

1. Move the "Unreleased" entries of [CHANGELOG.md](../CHANGELOG.md) under a new version and date, and update
   `"version"` in `package.json`.
2. Commit, then tag:

   ```bash
   git tag v1.1.0
   ```

   ```bash
   git push --follow-tags
   ```

3. On GitHub: **Releases → Draft a new release**, choose the tag, and paste the changelog section.

People who self-host update with the steps in [self-hosting → Updating](self-hosting.md#updating).
