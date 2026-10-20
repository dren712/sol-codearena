/**
 * Maps validation failure text onto editor line numbers.
 *
 * The sandbox wraps student code with an IIFE header, so a reported line L
 * refers to editor line L minus this offset. Line-bearing messages are rare
 * today (the runner usually surfaces only message text) but the plumbing is
 * honest: when a reference exists it is mapped with a known offset, and
 * references outside the file are dropped rather than guessed.
 */

/** Lines the vm wrapper prepends before student code (the IIFE header). */
export const SUBMISSION_LINE_OFFSET = 1;

const PATTERNS: RegExp[] = [
  /[\w.~-]+\.js:(\d+)(?::(\d+))?/g, // V8 frame: challenge-submission.js:12:9
  /\((\d+):(\d+)\)/g, // Babel/TS diagnostic style: Unexpected token (3:7)
  /\b[Ll]ine (\d+)\b/g, // plain English: line 42
];

export type FailureMarker = {
  /** 1-based editor line the failure can honestly be attached to. */
  line: number;
  /** Trimmed text that contained the reference, for the gutter tooltip. */
  message: string;
};

/**
 * Extracts deduped, in-range failure markers from arbitrary diagnostic text.
 *
 * `totalLines` is the editor buffer length so phantom lines from the wrapper
 * or transpiled output are never highlighted.
 */
export function extractFailureMarkers(
  texts: (string | null | undefined)[],
  totalLines: number
): FailureMarker[] {
  if (totalLines < 1) return [];

  const byLine = new Map<number, FailureMarker>();

  for (const text of texts) {
    if (!text) continue;

    for (const pattern of PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const reported = Number(match[1]);
        if (!Number.isFinite(reported) || reported <= 0) continue;

        const line = reported - SUBMISSION_LINE_OFFSET;
        if (line < 1 || line > totalLines) continue;

        if (!byLine.has(line)) {
          const sourceLine = text.slice(0, match.index).split('\n').pop() ?? '';
          const message = sourceLine.trim().slice(0, 180) || `Line ${line}`;
          byLine.set(line, { line, message });
        }
      }
    }
  }

  return Array.from(byLine.values()).sort((a, b) => a.line - b.line);
}
