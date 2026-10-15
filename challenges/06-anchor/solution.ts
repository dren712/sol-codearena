import { createHash } from 'crypto';

export function calculateAnchorDiscriminator(instructionName: string): Buffer {
  const preimage = `global:${instructionName}`;
  return createHash('sha256').update(preimage).digest().subarray(0, 8);
}
