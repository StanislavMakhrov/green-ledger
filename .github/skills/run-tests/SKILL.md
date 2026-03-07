---
name: run-tests
description: Run project tests using npm test (Vitest) and validate the build with next build.
---

# Run Tests

## Purpose

Provide standardized instructions for running tests and validating the build. Ensures agents use `npm test` for unit/integration tests and `npm run build` for build validation.

## When to Use This Skill

- Before committing code changes
- When verifying bug fixes or new features
- When running targeted tests during development
- When the full test suite must pass before marking work complete

## Hard Rules

### Must

- Use `npm test` for running the test suite
- Use `npm run build` (which runs `next build`) to validate the production build
- Run tests from the repository root
- Wait for test completion and check exit code (0 = pass, non-zero = fail)

### Must Not

- Never skip tests to make CI pass
- Never modify test expectations to match broken output — fix the code, not the tests
- Never ignore test failures

## Common Test Commands

### Run Full Test Suite

```bash
npm test
```

### Run Tests in Watch Mode (during development)

```bash
npm run test:watch
```

### Run a Specific Test File

```bash
npx vitest run path/to/test.test.ts
```

### Run Tests Matching a Pattern

```bash
npx vitest run --reporter=verbose -t "pattern"
```

### Validate Production Build

```bash
npm run build
```

### Run Lint + Type Check

```bash
npm run lint
npm run type-check
```

## Troubleshooting

### Tests fail with module not found

Run `npm ci` to ensure all dependencies are installed.

### Build fails with type errors

Run `npm run type-check` to see TypeScript errors independently of the build.

### Database-related test failures

Run `npx prisma db push` to ensure the database schema is up to date, then retry.

