import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SUBMISSION_LINE_OFFSET,
  extractFailureMarkers,
} from '../lib/marker-map';

test('maps a vm stack frame through the wrapper offset', () => {
  const text = 'at fn (challenge-submission.js:12:9)';
  const markers = extractFailureMarkers([text], 20);

  assert.equal(markers.length, 1);
  assert.equal(markers[0].line, 12 - SUBMISSION_LINE_OFFSET);
  assert.match(markers[0].message, /at fn/);
});

test('maps Babel-style (line:col) diagnostics', () => {
  const markers = extractFailureMarkers(['Unexpected token (3:7)'], 10);
  assert.deepEqual(markers.map((m) => m.line), [3 - SUBMISSION_LINE_OFFSET]);
});

test('drops references beyond the editor buffer', () => {
  assert.deepEqual(extractFailureMarkers(['Failed at line 404'], 83), []);
  assert.deepEqual(extractFailureMarkers(['frame challenge-submission.js:999:1'], 40), []);
});

test('dedupes to the first message per line', () => {
  const markers = extractFailureMarkers(
    ['first: challenge-submission.js:7:1', 'second: challenge-submission.js:7:2'],
    40
  );
  assert.equal(markers.length, 1);
  assert.match(markers[0].message, /first/);
});

test('tolerates empty and nullish text', () => {
  assert.deepEqual(extractFailureMarkers(['', null, undefined], 10), []);
});
