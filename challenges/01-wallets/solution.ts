import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

export interface SignResult {
  publicKey: string;
  signature: Uint8Array;
  verified: boolean;
}

export function generateAndSignMessage(message: string): SignResult {
  const keypair = Keypair.generate();
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  const verified = nacl.sign.detached.verify(messageBytes, signature, keypair.publicKey.toBytes());

  return {
    publicKey: keypair.publicKey.toBase58(),
    signature,
    verified,
  };
}
