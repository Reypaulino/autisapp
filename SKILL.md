# Git Workflow — Autism Learning Games

## Branch Structure

```
Dev-Bugs ──► Dev-Fixes ──► Dev-Review ──► Dev-WK ──► master
```

| Branch | Purpose |
|--------|---------|
| `Dev-Bugs` | Log and track all bugs. Every new bug discovered goes here first. |
| `Dev-Fixes` | Apply fixes for bugs logged in Dev-Bugs. Merge from Dev-Bugs when fixing. |
| `Dev-Review` | Review completed fixes before promoting. Merge from Dev-Fixes when fix is ready for review. |
| `Dev-WK` | Weekly working branch — accumulates reviewed, approved work. Merge from Dev-Review after review passes. |
| `master` | Stable production branch. Only receives merges from Dev-WK after full review cycle. |

---

## Workflow Steps

### 1. A bug is found
```bash
git checkout Dev-Bugs
# Document in doc/Bugs.md
git add doc/Bugs.md
git commit -m "bug: describe the issue"
git push origin Dev-Bugs
```

### 2. Fix the bug
```bash
git checkout Dev-Fixes
git merge Dev-Bugs
# Apply code fix
git add <changed files>
git commit -m "fix: describe what was fixed"
git push origin Dev-Fixes
# Update doc/Fixes.md and doc/Bugs.md (move to Closed)
```

### 3. Submit for review
```bash
git checkout Dev-Review
git merge Dev-Fixes
git push origin Dev-Review
# Open a pull request on GitHub: Dev-Fixes → Dev-Review
```

### 4. Review passes — promote to weekly work
```bash
git checkout Dev-WK
git merge Dev-Review
git push origin Dev-WK
```

### 5. Weekly release to master
```bash
git checkout master
git merge Dev-WK
git push origin master
```

---

## Repository

- **GitHub:** https://github.com/Reypaulino/autisapp
- **Remote protocol:** HTTPS
- **Default branch:** master

---

## Commit Message Conventions

| Prefix | When to use |
|--------|-------------|
| `bug:` | Documenting a new bug |
| `fix:` | Code fix for a bug |
| `feat:` | New feature or screen |
| `refactor:` | Code cleanup, no behavior change |
| `docs:` | Changes to doc/ or SKILL.md only |
| `chore:` | Dependencies, config, tooling |
