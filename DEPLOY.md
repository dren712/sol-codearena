# Deploy checklist — Solana Code Arena (Vercel + Supabase)

> **Program is LIVE on Devnet:** `A4oqd9fv4zzrFastj5VSNoe4ZdjHq3FUisSo3Dn1u6LS`
> (upgradeable, authority `~/.config/solana/id.json`). The web SDK, validator and
> PDA visualizer all derive from `apps/web/lib/sdk/index.ts` — one source of truth.
> On-chain flow proven end-to-end by `apps/web/tests/devnet-e2e.test.ts`
> (run with `ARENA_E2E=1`; funds the test wallet from your CLI wallet).
>
> Rust build notes for future deploys: keep `Cargo.lock` at `version = 3` —
> modern cargo rewrites it to v4, which silently breaks Anchor's bundled
> cargo (1.75). If a dependency needs `edition2024`, pin it down a few minors
> (block-buffer, indexmap, proc-macro2 …) with `cargo update -p <crate>@<ver>
> --precise <older>` and re-run `anchor build --no-idl` (the IDL needs a
> nightly-only `proc_macro` API).

## 1. Supabase (database)
> The repo currently presents from the **local SQLite file** (`apps/web/prisma/dev.db`).
> Deploying needs this first step, plus one schema swap documented after step 4.
1. Create a free project at https://supabase.com/dashboard (New project → pick a password).
2. Project Settings → **Database → Connection string** (or the `Connect` button) and copy BOTH:
   - **Transaction pooler (`:6543`)** → runtime. Append `?pgbouncer=true&connection_limit=1` if not present.
   - **Session pooler (`:5432`)** → migrations (`directUrl`).
3. Put them in `apps/web/.env` as `DATABASE_URL` and `DIRECT_DATABASE_URL`
   (placeholders are already there — just replace `CHANGE_ME` / region / ref).
4. Push schema + seed the honest builder data:
   ```
   npm --prefix apps/web run db:push
   npm --prefix apps/web run db:seed
   ```
   ⚠️ Must run with the *real* Supabase URLs (they push to the cloud DB).

5. **Schema swap** before deploying — in `apps/web/prisma/schema.prisma` replace the
   sqlite datasource with the commented-out `postgresql` block that sits right
   under it (and point `.env` `DATABASE_URL`/`DIRECT_DATABASE_URL` at the real
   pooler URLs instead of `file:./dev.db`).

## 2. AI tutor key
- Create a key at https://openrouter.ai/keys (`sk-or-v1-…`).
- Put it in `apps/web/.env`:
  ```
  OPENROUTER_API_KEY="sk-or-v1-…"
  OPENROUTER_MODEL="apodex/apodex-1.1-mini:free"
  AI_FALLBACK_MODEL="minimax/minimax-m3.1-flash:free"
  ```
- If the apodex model ever disappears or is queued, the tutor retries the
  fallback model, then falls back to the built-in offline tutor — it never
  shows an empty answer to a student.

## 3. Vercel
```
# one-time
vercel login                      # browser flow, you do this
cd apps/web
vercel link                       # or: vercel (creates the project)

# env vars (repeat for preview/prod as needed):
echo "<url>" | vercel env add DATABASE_URL production
echo "<url>" | vercel env add DIRECT_DATABASE_URL production
echo "sk-or-v1-…" | vercel env add OPENROUTER_API_KEY production
echo "apodex/apodex-1.1-mini:free" | vercel env add OPENROUTER_MODEL production
echo "minimax/minimax-m3.1-flash:free" | vercel env add AI_FALLBACK_MODEL production
echo "devnet"   | vercel env add SOLANA_CLUSTER production
echo "https://api.devnet.solana.com" | vercel env add SOLANA_RPC_URL production   # optional
echo "false"    | vercel env add REQUIRE_ONCHAIN_VERIFICATION production
# after first deploy, set the real URL then redeploy:
echo "https://<your-app>.vercel.app" | vercel env add NEXT_PUBLIC_SITE_URL production

# ship it
vercel --prod
```
(The `build` script already runs `prisma generate && next build`, which is
exactly what Vercel's build needs for Postgres.)

## Environment reference
| Variable | Where it's read | Notes |
| --- | --- | --- |
| `DATABASE_URL` | prisma schema datasource | locally `file:./dev.db`; on Vercel the transaction pooler with `?pgbouncer=true` |
| `DIRECT_DATABASE_URL` | prisma schema `directUrl` | Supabase session pooler for `db push`/migrate (deploy only) |
| `OPENROUTER_API_KEY` | `app/api/ai/tutor/route.ts` | tutor provider (priority 1) |
| `OPENROUTER_MODEL` | tutor route | default `apodex/apodex-1.1-mini:free` |
| `AI_FALLBACK_MODEL` | tutor route | default `minimax/minimax-m3.1-flash:free` |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | tutor route | optional lower-priority providers |
| `SOLANA_CLUSTER` | `lib/solana.ts` | `devnet` |
| `SOLANA_RPC_URL` | `lib/solana.ts` | dedicated RPC avoids public rate limits |
| `REQUIRE_ONCHAIN_VERIFICATION` | completions route | `false` while program isn't deployed |
| `NEXT_PUBLIC_SITE_URL` | OG tags / sitemap | set to the Vercel URL after first deploy |

## Local database history
The old local DB (`apps/web/prisma/dev.db`, SQLite) still exists with the
seeded builders, but the app now runs schema `postgresql` — the app and dev
server read from **Supabase** once `.env` points at it. The file is kept only
as a snapshot/reference.
