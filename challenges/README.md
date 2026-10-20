# Challenge reference material

These files are **human-readable mirrors** of the challenge catalogue. They are
not loaded by the application and are not covered by the automated tests.

| What | Where it actually lives |
| --- | --- |
| Challenge catalogue (starters, solutions, tests, hints, docs) | `apps/web/lib/challenges.ts` |
| Per-challenge test implementation | `apps/web/lib/validator/index.ts` |
| Standalone readable copies | `challenges/<slug>/{starter,solution}.ts` |

Because the catalogue is embedded in the app, **the app always reads
`apps/web/lib/challenges.ts`**. If you edit a solution here, the change will not
reach students — edit the catalogue instead, then update the mirror.

Coverage here is partial (01, 02 and 04 only). Adding a mirror is optional; the
authoritative copy is always the catalogue.