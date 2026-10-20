import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import type { Cluster } from '@solana/web3.js';
import { getCompletionPda, CODE_ARENA_PROGRAM_ID } from './sdk';

/** Cluster used for every server-side read. Defaults to devnet. */
export function getCluster(): Cluster {
  const configured = (process.env.SOLANA_CLUSTER || 'devnet').toLowerCase();
  if (configured === 'mainnet-beta' || configured === 'testnet') {
    return configured;
  }
  return 'devnet';
}

let cachedConnection: Connection | null = null;

/**
 * Shared read-only RPC connection.
 *
 * Set `SOLANA_RPC_URL` to a dedicated endpoint in production — the public
 * Devnet RPC aggressively rate limits server workloads.
 */
export function getConnection(): Connection {
  if (!cachedConnection) {
    const url = process.env.SOLANA_RPC_URL || clusterApiUrl(getCluster());
    cachedConnection = new Connection(url, 'confirmed');
  }
  return cachedConnection;
}

/** Base58 signatures are 87–88 characters. */
const SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;

/**
 * Whether a string has the shape of a real Solana transaction signature.
 *
 * The client used to mint a placeholder (`arena_proof_<random hex>`) when the
 * Devnet transaction could not be sent. Those must never be treated as proof.
 */
export function isPlausibleSignature(signature: string | null | undefined): boolean {
  return typeof signature === 'string' && SIGNATURE_PATTERN.test(signature.trim());
}

export type OnChainProof = {
  /** True only when the completion PDA exists on-chain and matches. */
  verified: boolean;
  /** Whether the transaction signature was found on-chain without error. */
  signatureConfirmed: boolean;
  /** Why verification failed, for display in the UI. */
  reason: string;
};

const UNVERIFIED: OnChainProof = {
  verified: false,
  signatureConfirmed: false,
  reason: 'No verifiable on-chain transaction was supplied.',
};

/**
 * Verifies a completion against Devnet.
 *
 * Two independent checks must pass:
 *  1. the transaction signature is confirmed by the cluster, and
 *  2. the Completion PDA for (wallet, challengeId) is owned by the program and
 *     contains the same challenge id.
 *
 * Always resolves — RPC failures downgrade to `verified: false` rather than
 * throwing, so a flaky RPC can never award a bogus completion.
 */
export async function verifyCompletionOnChain(
  walletAddress: string,
  challengeId: string,
  txSignature?: string | null,
  timeoutMs = 8000
): Promise<OnChainProof> {
  if (!isPlausibleSignature(txSignature)) {
    return {
      ...UNVERIFIED,
      reason: txSignature
        ? 'Supplied value is not a Solana transaction signature.'
        : UNVERIFIED.reason,
    };
  }

  const signature = txSignature!.trim();

  try {
    const connection = getConnection();
    const [completionPda] = getCompletionPda(new PublicKey(walletAddress), challengeId);

    const [statuses, accountInfo] = await Promise.all([
      withTimeout(
        connection.getSignatureStatuses([signature], { searchTransactionHistory: true }),
        timeoutMs,
        'signature lookup'
      ),
      withTimeout(
        connection.getAccountInfo(completionPda, 'confirmed'),
        timeoutMs,
        'account lookup'
      ),
    ]);

    const status = statuses?.value?.[0];

    if (!status || status.err) {
      return {
        verified: false,
        signatureConfirmed: false,
        reason: 'Transaction not found on the cluster (or it failed).',
      };
    }

    if (status.confirmationStatus !== 'confirmed' && status.confirmationStatus !== 'finalized') {
      return {
        verified: false,
        signatureConfirmed: false,
        reason: `Transaction is still ${status.confirmationStatus ?? 'unprocessed'}.`,
      };
    }

    // The signature landed on-chain; the remaining checks confirm it was *our*
    // program that recorded this specific challenge for this wallet.
    const signatureConfirmed = true;

    if (!accountInfo) {
      return {
        verified: false,
        signatureConfirmed,
        reason: 'Completion account does not exist at the expected PDA.',
      };
    }

    const ownedByProgram = accountInfo.owner.equals(CODE_ARENA_PROGRAM_ID);
    if (!ownedByProgram) {
      return {
        verified: false,
        signatureConfirmed,
        reason: 'Completion account is not owned by the Code Arena program.',
      };
    }

    // CompletionRecord layout: discriminator(8) + wallet(32) + id(32) + idLen(1) + ...
    const storedId = readStoredChallengeId(accountInfo.data);
    if (storedId && storedId !== challengeId) {
      return {
        verified: false,
        signatureConfirmed,
        reason: `Completion account stores "${storedId}", not "${challengeId}".`,
      };
    }

    return {
      verified: true,
      signatureConfirmed,
      reason: 'Verified on-chain.',
    };
  } catch (err: any) {
    return {
      verified: false,
      signatureConfirmed: false,
      reason: `Could not verify against the cluster: ${err?.message ?? 'unknown error'}`,
    };
  }
}

/** Extracts the zero-padded challenge id from raw CompletionRecord account data. */
export function readStoredChallengeId(data: Buffer): string | null {
  if (!data || data.length < 8 + 32 + 32 + 1) return null;

  const idBytes = data.subarray(8 + 32, 8 + 32 + 32);
  const idLen = data[8 + 32 + 32];

  if (idLen > 32) return null;

  return Buffer.from(idBytes.subarray(0, idLen)).toString('utf8') || null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out during ${label} after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}