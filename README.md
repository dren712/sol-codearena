# Solana Code Arena

An interactive learning platform for learning Solana development by solving
graded coding challenges in the browser. Student code is validated against a
real test suite, and passing completions can be recorded as proofs on Solana
Devnet through an Anchor program.

Built for the Fall Class Demo Day.

---

## What's in here

| Piece | Location | What it does |
| --- | --- | --- |
| Web app | `apps/web` | Next.js 14 UI, API routes, Monaco editor |
| Challenge catalogue | `apps/web/lib/challenges.ts` | Starters, solutions, tests, hints, docs |
| Validator | `apps/web/lib/validator/index.ts` | Sandboxed execution + per-challenge tests |
| Client SDK | `apps/web/lib/sdk/index.ts` | PDA derivation and instruction encoding |
| Grading rules | `apps/web/lib/progress.ts` | Server-authoritative score awarding |
| Anchor program | `programs/code_arena` | `initialize_user` and `record_completion` |
| Architecture diagrams | `scripts/output/`, `Solana_Code_Arena_Architecture.pdf` | System, PDA state and verification flows |

---

## Quick start

Requirements: **Node 20+** and (only for the on-chain parts) **Rust + Anchor CLI
0.30.1 + Solana CLI**.

```bash
# 1. Install dependencies
npm install

# 2. Create the SQLite database and seed the challenge rows
cp apps/web/.env.example apps/web/.env
npm run db:push
npm run db:seed

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000>. The app works without a wallet and without
Devnet SOL — completions are recorded locally and clearly marked *unverified*
until a real transaction lands.

### Getting Devnet SOL (optional)

```bash
solana config set --url devnet
solana airdrop 2            # or use https://faucet.solana.com
```

Or use the **Get Devnet SOL** button in the app.

---

## Common commands

Run from the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` / `npm start` | Production build and serve |
| `npm run check` | **Everything CI runs**: typecheck → lint → tests → `cargo test` → build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint via `next lint` |
| `npm test` | Validator, grading and SDK test suites (32 tests) |
| `npm run test:program` | `cargo test` for the Anchor program (9 tests) |
| `npm run check:program` | `cargo check` |
| `npm run db:push` / `db:seed` | Apply the Prisma schema / seed challenge rows |

---

## How grading works

The important property: **a browser cannot award itself points.**

1. The student submits code to `POST /api/validate`.
2. The code is compiled and executed inside a `node:vm` realm with a hard time
   budget (`VALIDATOR_TIMEOUT_MS`, 4s by default). `process`, the environment
   and the server's module graph are simply not present in the sandbox.
3. The validator runs the challenge's tests and returns a score.
4. A passed run is stored as a `Submission`.
5. `POST /api/completions` awards points **only** from a stored passing
   submission — the `score` field in the request body is ignored entirely, and
   stored scores are clamped to the challenge's point value.
6. If a transaction signature is supplied, the server checks it against the
   cluster *and* confirms the Completion PDA exists, is owned by the program,
   and holds the same challenge id. Only then is the completion marked
   verified.

Set `REQUIRE_ONCHAIN_VERIFICATION=true` to refuse any completion that is not
proven on-chain.

### Writing a challenge

The catalogue is data-driven. To add a challenge:

1. Add an entry to `CHALLENGES` in `apps/web/lib/challenges.ts` with a unique
   `id`/`slug`, `starterCode`, `solutionCode`, `testCases`, `hints` and
   `concepts`.
2. Add a `case` to the switch in `ChallengeValidator.validate` and implement
   its test method.
3. Run `npm test`. The suite executes **every** reference solution against the
   validator and fails if any of them no longer passes — which is what stops
   the catalogue and the validator from drifting apart.

---

## Deploying the program (optional)

```bash
anchor build
anchor deploy --provider.cluster devnet
```

Then update the program id in three places so they stay in sync (the test suite
fails if they disagree):

- `declare_id!` in `programs/code_arena/src/lib.rs`
- `CODE_ARENA_PROGRAM_ID` in `apps/web/lib/sdk/index.ts`
- `[programs.devnet]` in `Anchor.toml`

The id currently checked in is a placeholder — nothing is deployed yet.

---

## Project layout notes

- `challenges/` holds optional human-readable mirrors of individual challenges.
  **They are not loaded by the app** — see `challenges/README.md`.
- `tsconfig.json` maps `@packages/*` and `@challenges/data` into `apps/web/lib/`.
  Those older root-level `packages/` and `challenges/data.ts` copies were removed
  because they had silently drifted from the live code.

---

## Security notes

This app is built for a classroom, but two parts deserve care if you deploy it
publicly:

- **The validator executes untrusted code.** The `node:vm` sandbox plus the
  execution timeout protects availability (no infinite loops, no access to
  `process.env`), but `node:vm` is not a hard security boundary — a hostile
  submission can still reach host constructors. Run validation in a separate
  container or `isolated-vm` before exposing it to the internet.
- **Rate limiting is in-memory.** `apps/web/lib/rate-limit.ts` assumes a single
  Node process. Behind multiple instances or a serverless platform, move the
  buckets to a shared store.

The public routes (`/api/validate`, `/api/airdrop`, `/api/ai/tutor`,
`/api/completions`) all have per-IP limits; the Devnet faucet additionally has
a per-wallet cooldown.

---

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Monaco Editor ·
Prisma + SQLite · Anchor 0.30 / Rust · @solana/web3.js

## License

MIT — Darshan Gaikwad