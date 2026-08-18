# End-to-end smoke test

**Not executed in the environment this project was built in** — there's no
browser binary and no live database connection available there (see
`docs/PR_NOTES.md`). This is a real, runnable Playwright spec once you have
both.

## Setup

```bash
npm install
npx playwright install --with-deps chromium
npx prisma migrate dev
npm run db:seed
E2E_BASE_URL=http://localhost:3000 npx playwright test
```

The spec relies on the seeded demo accounts from `prisma/seed.ts`
(`customer@example.com`, `coordinator@example.com`, `driver@example.com`,
`admin@example.com`, all password `ChangeMe123!`). Run the seed script
against whichever database `DATABASE_URL` points at before running the
suite — a disposable Neon branch or local Postgres, never production.
