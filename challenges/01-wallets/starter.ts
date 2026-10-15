import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

export interface SignResult {
  publicKey: string;
  signature: Uint8Array;
  verified: boolean;
}

export function generateAndSignMessage(message: string): SignResult {
  // TODO: Implement keypair generation and signing
  return {
    publicKey: '',
    signature: new Uint8Array(),
    verified: false,
  };
}
