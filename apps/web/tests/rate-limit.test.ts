import test from 'node:test';
import assert from 'node:assert/strict';

import { clientKey, rateLimit, resetRateLimits } from '../lib/rate-limit';

const HEADERS = new Headers();

test('allows requests up to the limit, then blocks', () => {
  resetRateLimits();

  for (let i = 1; i <= 3; i++) {
    const result = rateLimit('a', 3, 60_000);
    assert.equal(result.allowed, true, `request ${i} should be allowed`);
    assert.equal(result.remaining, 3 - i);
  }

  const blocked = rateLimit('a', 3, 60_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSeconds > 0, 'a blocked caller must be told how long to wait');
});

test('buckets are independent per key', () => {
  resetRateLimits();

  rateLimit('a', 1, 60_000);
  assert.equal(rateLimit('a', 1, 60_000).allowed, false);
  assert.equal(rateLimit('b', 1, 60_000).allowed, true, 'other keys must be unaffected');
});

test('route scopes do not share a budget', () => {
  resetRateLimits();

  const headers = HEADERS;

  // Exhaust the validate budget...
  for (let i = 0; i < 40; i++) {
    rateLimit(clientKey(headers, 'validate', 'wallet-1'), 40, 60_000);
  }
  assert.equal(
    rateLimit(clientKey(headers, 'validate', 'wallet-1'), 40, 60_000).allowed,
    false
  );

  // ...the faucet must still work.
  assert.equal(
    rateLimit(clientKey(headers, 'airdrop', 'wallet-1'), 3, 60_000).allowed,
    true
  );
});

test('client keys isolate identities and respect proxy headers', () => {
  const alice = clientKey(HEADERS, 'validate', 'wallet-a');
  const bob = clientKey(HEADERS, 'validate', 'wallet-b');
  assert.notEqual(alice, bob, 'different wallets must not share a budget');

  const scoped = clientKey(HEADERS, 'validate', 'wallet-a');
  const otherRoute = clientKey(HEADERS, 'airdrop', 'wallet-a');
  assert.notEqual(scoped, otherRoute);

  const proxied = clientKey(
    new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }),
    'validate'
  );
  assert.match(proxied, /^203\.0\.113\.7\|validate$/);
});

test('reset clears every bucket', () => {
  rateLimit('a', 1, 60_000);
  assert.equal(rateLimit('a', 1, 60_000).allowed, false);

  resetRateLimits();
  assert.equal(rateLimit('a', 1, 60_000).allowed, true);
});