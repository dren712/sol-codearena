/**
 * Module resolution hook for the test runner.
 *
 * The app uses TypeScript path aliases (`@packages/*`, `@challenges/data`) and
 * extensionless relative imports, neither of which plain Node resolves on its
 * own. This hook teaches Node both conventions so the tests can import the app
 * source directly — no bundler, no extra dependencies.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(TESTS_DIR, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');

/** tsconfig `paths` aliases -> real files. */
const ALIASES = {
  '@packages/types': 'lib/types/index.ts',
  '@packages/sdk': 'lib/sdk/index.ts',
  '@packages/validator': 'lib/validator/index.ts',
  '@challenges/data': 'lib/challenges.ts',
};

const CANDIDATE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

export async function resolve(specifier, context, nextResolve) {
  // 1. tsconfig-style aliases
  if (specifier in ALIASES) {
    return {
      url: pathToFileURL(path.join(APP_ROOT, ALIASES[specifier])).href,
      shortCircuit: true,
    };
  }

  // 2. `@/...` maps to the app root
  if (specifier.startsWith('@/')) {
    const base = path.join(APP_ROOT, specifier.slice(2));
    return { url: resolveFirstExisting(base), shortCircuit: true };
  }

  // 3. Extensionless relative/absolute imports
  if (specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')) {
    const parentPath = context.parentURL
      ? path.dirname(fileURLToPath(context.parentURL))
      : APP_ROOT;
    const base = path.resolve(parentPath, specifier);

    const hit = CANDIDATE_SUFFIXES.map((suffix) => base + suffix).find((candidate) =>
      isFile(candidate)
    );

    if (hit) {
      return { url: pathToFileURL(hit).href, shortCircuit: true };
    }
  }

  // 4. Everything else (npm packages, node builtins)
  return nextResolve(specifier, context);
}

/** Repo-relative path helper for tests that read project files. */
export function repoPath(...segments) {
  return path.join(REPO_ROOT, ...segments);
}

function resolveFirstExisting(base) {
  const hit = CANDIDATE_SUFFIXES.map((suffix) => base + suffix).find((candidate) =>
    isFile(candidate)
  );
  return pathToFileURL(hit ?? base).href;
}

/** Directory imports must keep looking — only real files are valid resolutions. */
function isFile(candidate) {
  return existsSync(candidate) && statSync(candidate).isFile();
}