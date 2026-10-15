import { Challenge } from './types/index';

export const CHALLENGES: Challenge[] = [
  {
    id: '01-wallets',
    slug: '01-wallets',
    title: 'Wallets & Keypairs',
    order: 1,
    category: 'foundations',
    categoryLabel: 'Foundations',
    difficulty: 'beginner',
    points: 100,
    estimatedMinutes: 5,
    mode: 'code',
    description: 'Learn how Solana wallets, Ed25519 keypairs, and digital signatures function under the hood.',
    task: 'Implement `generateAndSignMessage(message: string)` to generate a fresh Keypair, convert the message to UTF-8 bytes, sign it with the private key, and return the public key, signature bytes, and signature verification result.',
    concepts: [
      {
        title: 'Ed25519 Keypairs & Addresses',
        content: 'On Solana, an account or wallet address is a 32-byte Ed25519 public key, usually formatted in Base58. The secret key is a 64-byte array (32-byte seed + 32-byte public key) used to produce unforgeable cryptographic signatures.',
        diagram: 'Private Key (64B) ──[Ed25519 Sign]──> Signature (64B)\nPublic Key (32B)  ──[Verify]─────────> Valid/Invalid (boolean)',
        codeSnippet: `import { Keypair } from '@solana/web3.js';\nconst keypair = Keypair.generate();\nconsole.log(keypair.publicKey.toBase58());`
      },
      {
        title: 'Detached Signatures & Verification',
        content: 'Signatures allow a wallet to prove authorization without ever revealing the private key. In Solana web3, tweetnacl provides the standard detached sign and verify primitives.',
        codeSnippet: `import nacl from 'tweetnacl';\nconst signature = nacl.sign.detached(messageBytes, keypair.secretKey);\nconst isValid = nacl.sign.detached.verify(messageBytes, signature, keypair.publicKey.toBytes());`
      }
    ],
    starterCode: `import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

export interface SignResult {
  publicKey: string;
  signature: Uint8Array;
  verified?: boolean;
  isValid?: boolean;
}

export function generateAndSignMessage(message: string): SignResult {
  // TODO: 1. Generate a new Keypair
  // TODO: 2. Convert message into Uint8Array bytes using TextEncoder
  // TODO: 3. Create a detached signature using nacl.sign.detached
  // TODO: 4. Verify the signature using nacl.sign.detached.verify
  // TODO: 5. Return { publicKey, signature, verified }

  return {
    publicKey: '',
    signature: new Uint8Array(),
    verified: false,
  };
}`,
    solutionCode: `import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

export interface SignResult {
  publicKey: string;
  signature: Uint8Array;
  verified?: boolean;
  isValid?: boolean;
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
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Generate valid Base58 public key',
        description: 'Returned publicKey must be a valid 32-44 character Base58 Solana address.'
      },
      {
        id: 'test-2',
        name: 'Produce 64-byte Ed25519 signature',
        description: 'The detached signature must be exactly 64 bytes.'
      },
      {
        id: 'test-3',
        name: 'Cryptographic signature verification passes',
        description: 'Verification of message against public key and signature must return true.'
      }
    ],
    hints: [
      'Use `Keypair.generate()` to create a fresh cryptographic keypair.',
      'Use `new TextEncoder().encode(message)` to convert a UTF-8 string into a byte array.',
      '`nacl.sign.detached(bytes, keypair.secretKey)` produces the 64-byte signature.',
      '`nacl.sign.detached.verify(bytes, signature, keypair.publicKey.toBytes())` validates it.'
    ],
    docLinks: [
      { title: 'Solana Cookbook: Keypairs', url: 'https://solanacookbook.com/references/keypairs-and-wallets.html' },
      { title: 'Solana Web3.js Docs: Keypair', url: 'https://solana-labs.github.io/solana-web3.js/classes/Keypair.html' }
    ]
  },
  {
    id: '02-transactions',
    slug: '02-transactions',
    title: 'Transactions & Transfers',
    order: 2,
    category: 'foundations',
    categoryLabel: 'Foundations',
    difficulty: 'beginner',
    points: 100,
    estimatedMinutes: 7,
    mode: 'code',
    description: 'Learn how Solana transactions are constructed with instructions, fee payers, and recent blockhashes.',
    task: 'Implement `buildTransferTransaction(fromPubkey, toPubkey, lamports, blockhash)` to construct a valid Solana Transaction with a SystemProgram.transfer instruction, feePayer set to `fromPubkey`, and recentBlockhash configured.',
    concepts: [
      {
        title: 'Solana Transaction Model',
        content: 'A Solana transaction is an atomic package of one or more instructions executed in sequential order. If any instruction fails, all changes revert. Every transaction requires a fee payer and a recent blockhash for replay protection.',
        diagram: 'Transaction\n ├── feePayer: PublicKey\n ├── recentBlockhash: string\n └── instructions: [\n       SystemProgram.transfer({\n         fromPubkey,\n         toPubkey,\n         lamports\n       })\n     ]',
        codeSnippet: `import { Transaction, SystemProgram } from '@solana/web3.js';\nconst tx = new Transaction().add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));\ntx.feePayer = fromPubkey;\ntx.recentBlockhash = blockhash;`
      }
    ],
    starterCode: `import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

export function buildTransferTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number,
  recentBlockhash: string
): Transaction {
  // TODO: 1. Create a new Transaction instance
  // TODO: 2. Add SystemProgram.transfer instruction
  // TODO: 3. Set tx.feePayer = fromPubkey
  // TODO: 4. Set tx.recentBlockhash = recentBlockhash
  // TODO: 5. Return the transaction

  return new Transaction();
}`,
    solutionCode: `import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

export function buildTransferTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number,
  recentBlockhash: string
): Transaction {
  const tx = new Transaction();
  tx.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );
  tx.feePayer = fromPubkey;
  tx.recentBlockhash = recentBlockhash;
  return tx;
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Contains SystemProgram.transfer instruction',
        description: 'Transaction should have 1 instruction belonging to SystemProgram.programId.'
      },
      {
        id: 'test-2',
        name: 'Fee payer properly assigned',
        description: 'tx.feePayer must equal the fromPubkey parameter.'
      },
      {
        id: 'test-3',
        name: 'Blockhash properly assigned',
        description: 'tx.recentBlockhash must match the provided blockhash string.'
      }
    ],
    hints: [
      'Call `new Transaction().add(...)` to bundle instructions.',
      'Use `SystemProgram.transfer({ fromPubkey, toPubkey, lamports })`.',
      'Remember to assign `tx.feePayer = fromPubkey` and `tx.recentBlockhash = recentBlockhash`.'
    ],
    docLinks: [
      { title: 'Solana Docs: Transactions', url: 'https://docs.solana.com/developing/programming-model/transactions' }
    ]
  },
  {
    id: '03-accounts',
    slug: '03-accounts',
    title: 'Accounts & State',
    order: 3,
    category: 'foundations',
    categoryLabel: 'Foundations',
    difficulty: 'beginner',
    points: 100,
    estimatedMinutes: 6,
    mode: 'code',
    description: 'Understand the fundamental Solana account model: lamports, ownership, executable flag, and rent.',
    task: 'Implement `inspectAccount(accountInfo)` to inspect a fetched AccountInfo object. Convert lamports to SOL (`1 SOL = 1,000,000,000 lamports`), check if the account is owned by the System Program, and return structured inspection details.',
    concepts: [
      {
        title: 'Everything is an Account',
        content: 'Unlike EVM where code and storage live together in contracts, Solana separates code and data. Programs are stateless accounts marked `executable = true`. User state is stored in separate data accounts owned by those programs.',
        diagram: 'Account\n ├── lamports: number (balance in 1e-9 SOL)\n ├── owner: PublicKey (program with write authority)\n ├── executable: boolean (true if compiled BPF program)\n └── data: Buffer (raw byte storage)',
        codeSnippet: `import { LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';\nconst sol = lamports / LAMPORTS_PER_SOL;\nconst isSystemOwned = owner.equals(SystemProgram.programId);`
      }
    ],
    starterCode: `import { AccountInfo, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';

export interface AccountReport {
  solBalance: number;
  isExecutable: boolean;
  isSystemOwned: boolean;
  dataLength: number;
  ownerAddress: string;
}

export function inspectAccount(
  accountInfo: AccountInfo<Buffer> | null
): AccountReport | null {
  if (!accountInfo) return null;

  // TODO: 1. Calculate SOL balance (lamports / LAMPORTS_PER_SOL)
  // TODO: 2. Check if owner equals SystemProgram.programId
  // TODO: 3. Return AccountReport object

  return {
    solBalance: 0,
    isExecutable: false,
    isSystemOwned: false,
    dataLength: 0,
    ownerAddress: '',
  };
}`,
    solutionCode: `import { AccountInfo, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';

export interface AccountReport {
  solBalance: number;
  isExecutable: boolean;
  isSystemOwned: boolean;
  dataLength: number;
  ownerAddress: string;
}

export function inspectAccount(
  accountInfo: AccountInfo<Buffer> | null
): AccountReport | null {
  if (!accountInfo) return null;

  const solBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
  const isSystemOwned = accountInfo.owner.equals(SystemProgram.programId);

  return {
    solBalance,
    isExecutable: accountInfo.executable,
    isSystemOwned,
    dataLength: accountInfo.data.length,
    ownerAddress: accountInfo.owner.toBase58(),
  };
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Correct SOL balance calculation',
        description: '2,500,000,000 lamports must convert to 2.5 SOL.'
      },
      {
        id: 'test-2',
        name: 'SystemProgram ownership check',
        description: 'Returns isSystemOwned: true when owner is 11111111111111111111111111111111.'
      },
      {
        id: 'test-3',
        name: 'Handles null account properly',
        description: 'Returns null when account does not exist.'
      }
    ],
    hints: [
      'Divide `accountInfo.lamports` by `LAMPORTS_PER_SOL` (1,000,000,000).',
      'Use `accountInfo.owner.equals(SystemProgram.programId)` for checking program ownership.',
      'Check `accountInfo.data.length` for byte storage size.'
    ],
    docLinks: [
      { title: 'Solana Docs: Account Model', url: 'https://docs.solana.com/developing/programming-model/accounts' }
    ]
  },
  {
    id: '04-pdas',
    slug: '04-pdas',
    title: 'Program Derived Addresses (PDAs)',
    order: 4,
    category: 'programs',
    categoryLabel: 'Programs',
    difficulty: 'intermediate',
    points: 150,
    estimatedMinutes: 10,
    mode: 'code',
    description: 'The flagship Solana concept! Learn how deterministic off-curve addresses are derived from seeds.',
    task: 'Implement `deriveUserPda(wallet: PublicKey, programId: PublicKey): [PublicKey, number]` to derive a user state PDA using the seed string "user" and the user\'s wallet public key.',
    concepts: [
      {
        title: 'What is a PDA?',
        content: 'Program Derived Addresses (PDAs) are addresses that look like standard public keys, but lie off the Ed25519 elliptic curve. Because they have no corresponding private key, nobody can sign for them externally—only the program that derived them can sign on their behalf using `invoke_signed`.',
        diagram: 'Seeds: ["user", walletPubkey]\nProgram ID: ArenaProgram\n      │\n      ▼\nSHA256 Hash + Bump (255 down to 0)\n      │\n      ▼ Off-curve check\n[ PDA Address , bump ]\nNo private key exists!',
        codeSnippet: `import { PublicKey } from '@solana/web3.js';\nconst [pda, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from("user"), wallet.toBuffer()],\n  programId\n);`
      },
      {
        title: 'Why PDAs Matter for Demo Day',
        content: 'PDAs act like key-value database keys on Solana. In Code Arena, your user progress is stored at PDA `["user", wallet]`, and each challenge completion is stored at PDA `["completion", wallet, challenge_id]`.',
        codeSnippet: `// Deterministic seed formula:\n[Buffer.from("completion"), wallet.toBuffer(), Buffer.from("04-pdas")]`
      }
    ],
    starterCode: `import { PublicKey } from '@solana/web3.js';

/**
 * Derive the User PDA for Solana Code Arena.
 * Seed format: ["user", wallet_pubkey]
 *
 * @param wallet The student's wallet public key
 * @param programId The Code Arena program ID
 * @returns [pdaAddress, bumpSeed]
 */
export function deriveUserPda(
  wallet: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  // TODO: 1. Convert string "user" to Buffer via Buffer.from("user")
  // TODO: 2. Convert wallet public key to Buffer via wallet.toBuffer()
  // TODO: 3. Call PublicKey.findProgramAddressSync([seed1, seed2], programId)
  // TODO: 4. Return the tuple [pda, bump]

  return [PublicKey.default, 0];
}`,
    solutionCode: `import { PublicKey } from '@solana/web3.js';

export function deriveUserPda(
  wallet: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  const seeds = [
    Buffer.from('user'),
    wallet.toBuffer()
  ];

  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, programId);
  return [pda, bump];
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Derives deterministic off-curve PDA',
        description: 'PDA must not lie on the Ed25519 elliptic curve (`PublicKey.isOnCurve(pda)` must be false).'
      },
      {
        id: 'test-2',
        name: 'Returns valid bump seed (0-255)',
        description: 'Canonical bump must be an integer between 0 and 255 (usually 255 or 254).'
      },
      {
        id: 'test-3',
        name: 'Matches expected reference PDA for test wallet',
        description: 'Given known wallet and programId, the derived address must match reference output exactly.'
      }
    ],
    hints: [
      'Use `Buffer.from("user")` for the literal prefix seed.',
      'Use `wallet.toBuffer()` to obtain the 32-byte representation of the wallet public key.',
      '`PublicKey.findProgramAddressSync(seeds, programId)` automatically searches for the valid canonical bump starting at 255.',
      'Notice that the returned PDA has no private key: it is strictly controlled by `programId`!'
    ],
    docLinks: [
      { title: 'Solana Cookbook: PDAs', url: 'https://solanacookbook.com/core-concepts/pdas.html' },
      { title: 'Solana Web3.js: findProgramAddressSync', url: 'https://solana-labs.github.io/solana-web3.js/classes/PublicKey.html#findProgramAddressSync' }
    ]
  },
  {
    id: '05-instructions',
    slug: '05-instructions',
    title: 'Custom Program Instructions',
    order: 5,
    category: 'programs',
    categoryLabel: 'Programs',
    difficulty: 'intermediate',
    points: 120,
    estimatedMinutes: 8,
    mode: 'code',
    description: 'Learn how low-level Solana instructions are packed with AccountMeta arrays and binary instruction data.',
    task: 'Implement `buildArenaInstruction(programId, userWallet, pdaAccount, actionTag)` to construct a custom `TransactionInstruction`. Specify `isSigner: true, isWritable: true` for the user wallet and `isSigner: false, isWritable: true` for the PDA.',
    concepts: [
      {
        title: 'TransactionInstruction Breakdown',
        content: 'Every Solana instruction specifies three things: 1. `programId`: The program to invoke. 2. `keys`: An array of `AccountMeta` specifying pubkey, `isSigner`, and `isWritable`. 3. `data`: A raw binary Buffer containing instruction arguments.',
        diagram: 'TransactionInstruction\n ├── programId: PublicKey\n ├── keys: [\n │     { pubkey: userWallet, isSigner: true, isWritable: true },\n │     { pubkey: pdaAccount, isSigner: false, isWritable: true }\n │   ]\n └── data: Buffer [ actionTag, ...payload ]',
        codeSnippet: `import { TransactionInstruction } from '@solana/web3.js';\nconst ix = new TransactionInstruction({\n  keys: [{ pubkey: user, isSigner: true, isWritable: true }],\n  programId,\n  data: Buffer.from([actionTag])\n});`
      }
    ],
    starterCode: `import { TransactionInstruction, PublicKey, AccountMeta } from '@solana/web3.js';

export function buildArenaInstruction(
  programId: PublicKey,
  userWallet: PublicKey,
  pdaAccount: PublicKey,
  actionTag: number
): TransactionInstruction {
  // TODO: 1. Build keys array with AccountMeta items:
  //         - userWallet: isSigner=true, isWritable=true
  //         - pdaAccount: isSigner=false, isWritable=true
  // TODO: 2. Pack actionTag into a 1-byte Buffer
  // TODO: 3. Return new TransactionInstruction({ keys, programId, data })

  return new TransactionInstruction({
    keys: [],
    programId,
    data: Buffer.alloc(0)
  });
}`,
    solutionCode: `import { TransactionInstruction, PublicKey, AccountMeta } from '@solana/web3.js';

export function buildArenaInstruction(
  programId: PublicKey,
  userWallet: PublicKey,
  pdaAccount: PublicKey,
  actionTag: number
): TransactionInstruction {
  const keys: AccountMeta[] = [
    {
      pubkey: userWallet,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: pdaAccount,
      isSigner: false,
      isWritable: true,
    },
  ];

  const data = Buffer.from([actionTag]);

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Contains correct AccountMeta permissions',
        description: 'User must be signer + writable; PDA must be non-signer + writable.'
      },
      {
        id: 'test-2',
        name: 'Packs actionTag into binary buffer',
        description: 'instruction.data[0] must equal the provided actionTag number.'
      },
      {
        id: 'test-3',
        name: 'Targets correct programId',
        description: 'instruction.programId must match the passed programId argument.'
      }
    ],
    hints: [
      'Each item in `keys` must have `{ pubkey, isSigner, isWritable }`.',
      'Use `Buffer.from([actionTag])` to allocate a 1-byte buffer.',
      'Check that `userWallet` has `isSigner: true` since the user must sign their own transaction.'
    ],
    docLinks: [
      { title: 'Solana Web3.js: TransactionInstruction', url: 'https://solana-labs.github.io/solana-web3.js/classes/TransactionInstruction.html' }
    ]
  },
  {
    id: '06-anchor',
    slug: '06-anchor',
    title: 'Anchor Framework & Discriminators',
    order: 6,
    category: 'programs',
    categoryLabel: 'Programs',
    difficulty: 'intermediate',
    points: 150,
    estimatedMinutes: 9,
    mode: 'code',
    description: 'Learn how Anchor uses 8-byte instruction and account discriminators derived from SHA-256 hashes.',
    task: 'Implement `calculateAnchorDiscriminator(name: string): Buffer` to compute Anchor\'s 8-byte instruction discriminator: `sha256("global:<name>")[0..8]`.',
    concepts: [
      {
        title: 'Anchor Instruction Discriminators',
        content: 'Anchor programs identify instructions and accounts through an 8-byte prefix called a discriminator. For an instruction named `initialize_user`, Anchor calculates `sha256("global:initialize_user")` and takes the first 8 bytes. For accounts, it calculates `sha256("account:<AccountName>")`.',
        diagram: 'String: "global:record_completion"\n        │\n        ▼ SHA-256 Hash (32 bytes)\n[ 0x8a, 0x14, 0xef, 0x49, 0xb2, 0xc1, 0x90, 0x3d, ...24 bytes ]\n        │ First 8 Bytes\n        ▼\nAnchor Discriminator (8 bytes)',
        codeSnippet: `import { createHash } from 'crypto';\nconst hash = createHash('sha256').update('global:initialize_user').digest();\nconst discriminator = hash.subarray(0, 8);`
      }
    ],
    starterCode: `import { createHash } from 'crypto';

/**
 * Calculates Anchor's 8-byte instruction discriminator.
 * Formula: first 8 bytes of sha256("global:" + instructionName)
 *
 * @param instructionName e.g. "initialize_user" or "record_completion"
 * @returns 8-byte Buffer
 */
export function calculateAnchorDiscriminator(instructionName: string): Buffer {
  // TODO: 1. Construct preimage string "global:" + instructionName
  // TODO: 2. Compute SHA256 hash using createHash('sha256')
  // TODO: 3. Slice the first 8 bytes
  // TODO: 4. Return as Buffer

  return Buffer.alloc(8);
}`,
    solutionCode: `import { createHash } from 'crypto';

export function calculateAnchorDiscriminator(instructionName: string): Buffer {
  const preimage = \`global:\${instructionName}\`;
  const hash = createHash('sha256').update(preimage).digest();
  return hash.subarray(0, 8);
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Returns exactly 8 bytes buffer',
        description: 'Result length must be exactly 8 bytes.'
      },
      {
        id: 'test-2',
        name: 'Matches known Anchor discriminator for initialize_user',
        description: 'Preimage "global:initialize_user" must produce exact 8-byte hash slice.'
      },
      {
        id: 'test-3',
        name: 'Matches known Anchor discriminator for record_completion',
        description: 'Preimage "global:record_completion" must produce exact 8-byte hash slice.'
      }
    ],
    hints: [
      'Prepend `"global:"` before the instruction name.',
      'Call `createHash("sha256").update(preimage).digest()`.',
      'Use `hash.subarray(0, 8)` to slice the first 8 bytes.'
    ],
    docLinks: [
      { title: 'Anchor Book: Discriminators', url: 'https://www.anchor-lang.com/docs/discriminator' }
    ]
  },
  {
    id: '07-spl-tokens',
    slug: '07-spl-tokens',
    title: 'SPL Tokens & Decimals',
    order: 7,
    category: 'tokens',
    categoryLabel: 'Tokens',
    difficulty: 'intermediate',
    points: 120,
    estimatedMinutes: 8,
    mode: 'code',
    description: 'Learn how SPL Tokens work: Mint accounts, decimal precision, and converting UI human amounts to raw integer units.',
    task: 'Implement `uiAmountToRawUnits(amountUi: number, decimals: number): bigint` and `rawUnitsToUi(rawUnits: bigint, decimals: number): number` for SPL Token calculations.',
    concepts: [
      {
        title: 'SPL Token Mint & Units',
        content: 'Solana has no floating point numbers on-chain. Token balances are stored as unsigned 64-bit integers (`u64`). If USDC has 6 decimals, $1.50 is stored on-chain as `1,500,000` base units. If SOL has 9 decimals, 2.5 SOL is `2,500,000,000` lamports.',
        diagram: 'Human Amount: $1.50 USDC\nDecimals: 6\nBase Units = 1.50 * 10^6 = 1,500,000 base units (BigInt)',
        codeSnippet: `const raw = BigInt(Math.round(amount * Math.pow(10, decimals)));\nconst ui = Number(raw) / Math.pow(10, decimals);`
      }
    ],
    starterCode: `export function uiAmountToRawUnits(amountUi: number, decimals: number): bigint {
  // TODO: Convert decimal human amount to raw integer base units (bigint)
  // Example: 1.5 with 6 decimals -> 1500000n

  return 0n;
}

export function rawUnitsToUi(rawUnits: bigint, decimals: number): number {
  // TODO: Convert raw integer base units back to human float
  // Example: 1500000n with 6 decimals -> 1.5

  return 0;
}`,
    solutionCode: `export function uiAmountToRawUnits(amountUi: number, decimals: number): bigint {
  const factor = 10 ** decimals;
  return BigInt(Math.round(amountUi * factor));
}

export function rawUnitsToUi(rawUnits: bigint, decimals: number): number {
  const factor = 10 ** decimals;
  return Number(rawUnits) / factor;
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Converts 1.5 USDC (6 decimals) to 1500000n',
        description: '1.5 with 6 decimals must equal 1500000n.'
      },
      {
        id: 'test-2',
        name: 'Converts 2.75 SOL (9 decimals) to 2750000000n',
        description: '2.75 with 9 decimals must equal 2750000000n.'
      },
      {
        id: 'test-3',
        name: 'Converts raw base units back to UI amount',
        description: '1500000n with 6 decimals must equal 1.5.'
      }
    ],
    hints: [
      'Scale by `10 ** decimals`.',
      'Use `BigInt(Math.round(amountUi * factor))` to avoid floating point precision artifacts.',
      'Reverse by dividing `Number(rawUnits)` by `10 ** decimals`.'
    ],
    docLinks: [
      { title: 'Solana SPL Token Docs', url: 'https://spl.solana.com/token' }
    ]
  },
  {
    id: '08-token-accounts',
    slug: '08-token-accounts',
    title: 'Associated Token Accounts (ATAs)',
    order: 8,
    category: 'tokens',
    categoryLabel: 'Tokens',
    difficulty: 'intermediate',
    points: 130,
    estimatedMinutes: 8,
    mode: 'code',
    description: 'Learn how Associated Token Accounts (ATAs) deterministically map a user wallet and mint address to a token balance account.',
    task: 'Implement `deriveAssociatedTokenAccount(wallet: PublicKey, mint: PublicKey): PublicKey` to derive the deterministic ATA address using seeds `[wallet, TOKEN_PROGRAM_ID, mint]` with the Associated Token Program.',
    concepts: [
      {
        title: 'Why Associated Token Accounts?',
        content: 'In Solana, your wallet does not hold tokens directly; instead, it holds tokens in separate Token Accounts. To prevent users having multiple random token accounts for the same mint, Solana created the Associated Token Account (ATA) convention. Every wallet has exactly one deterministic ATA for each token mint.',
        diagram: 'Wallet (Alice) + Token Mint (USDC)\n      │\n      ▼ Seeds: [wallet, TOKEN_PROGRAM_ID, mint]\nAssociated Token Account (Alice USDC ATA)\nStores Alice\'s USDC balance and owner = Alice',
        codeSnippet: `import { getAssociatedTokenAddressSync } from '@solana/spl-token';\nconst ata = getAssociatedTokenAddressSync(mintPubkey, walletPubkey);`
      }
    ],
    starterCode: `import { PublicKey } from '@solana/web3.js';

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

/**
 * Derives the Associated Token Account (ATA) address for a wallet and mint.
 * Seeds: [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()]
 * Program: ASSOCIATED_TOKEN_PROGRAM_ID
 */
export function deriveAssociatedTokenAccount(
  wallet: PublicKey,
  mint: PublicKey
): PublicKey {
  // TODO: 1. Create seeds array: [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()]
  // TODO: 2. Call PublicKey.findProgramAddressSync(seeds, ASSOCIATED_TOKEN_PROGRAM_ID)
  // TODO: 3. Return the derived public key

  return PublicKey.default;
}`,
    solutionCode: `import { PublicKey } from '@solana/web3.js';

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

export function deriveAssociatedTokenAccount(
  wallet: PublicKey,
  mint: PublicKey
): PublicKey {
  const seeds = [
    wallet.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ];

  const [ata] = PublicKey.findProgramAddressSync(seeds, ASSOCIATED_TOKEN_PROGRAM_ID);
  return ata;
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Produces off-curve PDA',
        description: 'The derived ATA must be off the curve.'
      },
      {
        id: 'test-2',
        name: 'Matches SPL Token getAssociatedTokenAddressSync',
        description: 'Derivation must yield the exact standard ATA address.'
      },
      {
        id: 'test-3',
        name: 'Deterministic across repeated calls',
        description: 'Calling multiple times with identical arguments returns identical ATA.'
      }
    ],
    hints: [
      'The seeds order is strictly `[wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()]`.',
      'The owner program is `ASSOCIATED_TOKEN_PROGRAM_ID`, not the standard Token Program.',
      'Take the first element of `PublicKey.findProgramAddressSync(seeds, ASSOCIATED_TOKEN_PROGRAM_ID)`.'
    ],
    docLinks: [
      { title: 'SPL Associated Token Account Program', url: 'https://spl.solana.com/associated-token-account' }
    ]
  },
  {
    id: '09-cpi',
    slug: '09-cpi',
    title: 'Cross-Program Invocation (CPI)',
    order: 9,
    category: 'advanced',
    categoryLabel: 'Advanced Fundamentals',
    difficulty: 'advanced',
    points: 180,
    estimatedMinutes: 12,
    mode: 'code',
    description: 'Learn how Solana programs call other programs using Cross-Program Invocations and pass privileged signers.',
    task: 'Implement `buildCpiTransferInstruction(fromPubkey, toPubkey, lamports)` to construct the exact instruction representation passed during a CPI into the System Program.',
    concepts: [
      {
        title: 'Cross-Program Invocation (CPI)',
        content: 'Composability in Solana is enabled by Cross-Program Invocations (CPI). In Rust, programs use `invoke` or `invoke_signed`. When invoking another program, all accounts needed by the callee must have already been passed into the original caller transaction.',
        diagram: 'Client Transaction ──> Program A (Code Arena)\n                            │\n                            ├── CPI: invoke_signed(...)\n                            ▼\n                        Program B (System Program / Token Program)',
        codeSnippet: `// Rust Anchor CPI example:\nlet cpi_ctx = CpiContext::new(\n    ctx.accounts.token_program.to_account_info(),\n    Transfer { from: ctx.accounts.from.to_account_info(), ... }\n);\ntoken::transfer(cpi_ctx, amount)?;`
      }
    ],
    starterCode: `import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';

export interface CpiPreparation {
  calleeProgramId: string;
  accountsCount: number;
  isPayerWritable: boolean;
  isRecipientWritable: boolean;
  instruction: TransactionInstruction;
}

export function buildCpiTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number
): CpiPreparation {
  // TODO: 1. Create SystemProgram.transfer instruction
  // TODO: 2. Check accounts metadata
  // TODO: 3. Return structured CpiPreparation summary

  return {
    calleeProgramId: '',
    accountsCount: 0,
    isPayerWritable: false,
    isRecipientWritable: false,
    instruction: new TransactionInstruction({ keys: [], programId: PublicKey.default }),
  };
}`,
    solutionCode: `import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';

export interface CpiPreparation {
  calleeProgramId: string;
  accountsCount: number;
  isPayerWritable: boolean;
  isRecipientWritable: boolean;
  instruction: TransactionInstruction;
}

export function buildCpiTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number
): CpiPreparation {
  const instruction = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  });

  return {
    calleeProgramId: instruction.programId.toBase58(),
    accountsCount: instruction.keys.length,
    isPayerWritable: instruction.keys[0].isWritable,
    isRecipientWritable: instruction.keys[1].isWritable,
    instruction,
  };
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Targets System Program as callee',
        description: 'Callee program ID must equal SystemProgram (11111111111111111111111111111111).'
      },
      {
        id: 'test-2',
        name: 'Marks both payer and recipient accounts as writable',
        description: 'Both accounts in SystemProgram.transfer must have isWritable = true.'
      },
      {
        id: 'test-3',
        name: 'Instruction data contains encoded transfer lamports',
        description: 'Instruction data buffer length must be 12 bytes (4-byte instruction index + 8-byte u64 lamports).'
      }
    ],
    hints: [
      'Call `SystemProgram.transfer({ fromPubkey, toPubkey, lamports })`.',
      'The callee program ID is `instruction.programId.toBase58()`.',
      'Inspect `instruction.keys` to verify account writability flags.'
    ],
    docLinks: [
      { title: 'Solana Docs: Cross-Program Invocation', url: 'https://docs.solana.com/developing/programming-model/calling-between-programs' }
    ]
  },
  {
    id: '10-deploy',
    slug: '10-deploy',
    title: 'Deploy & Verify',
    order: 10,
    category: 'advanced',
    categoryLabel: 'Advanced Fundamentals',
    difficulty: 'advanced',
    points: 200,
    estimatedMinutes: 10,
    mode: 'code',
    description: 'Learn how Solana programs are deployed as BPF Upgradeable accounts and verify program status on Devnet.',
    task: 'Implement `verifyProgramAccount(accountInfo)` to verify that an account is an authentic executable Solana program owned by the BPF Upgradeable Loader.',
    concepts: [
      {
        title: 'BPF Upgradeable Loader',
        content: 'On Solana, user programs are owned by the BPF Upgradeable Loader (`BPFLoaderUpgradeab1e11111111111111111111111`). The Program Account points to a separate ProgramData account containing the compiled executable bytecode and upgrade authority.',
        diagram: 'Program Account\n ├── executable = true\n └── owner = BPF Upgradeable Loader\n       │ points to\n       ▼\nProgramData Account\n ├── Upgrade Authority (or None)\n └── Executable Bytecode Buffer',
        codeSnippet: `const BPF_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');\nconst isValidProgram = accountInfo.executable && accountInfo.owner.equals(BPF_LOADER);`
      }
    ],
    starterCode: `import { AccountInfo, PublicKey } from '@solana/web3.js';

export const BPF_UPGRADEABLE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
);

export interface VerificationStatus {
  isProgram: boolean;
  isExecutable: boolean;
  isUpgradeableLoader: boolean;
  reason?: string;
}

export function verifyProgramAccount(
  accountInfo: AccountInfo<Buffer> | null
): VerificationStatus {
  if (!accountInfo) {
    return {
      isProgram: false,
      isExecutable: false,
      isUpgradeableLoader: false,
      reason: 'Account does not exist on network',
    };
  }

  // TODO: 1. Check if accountInfo.executable is true
  // TODO: 2. Check if accountInfo.owner equals BPF_UPGRADEABLE_LOADER_ID
  // TODO: 3. Return VerificationStatus

  return {
    isProgram: false,
    isExecutable: false,
    isUpgradeableLoader: false,
  };
}`,
    solutionCode: `import { AccountInfo, PublicKey } from '@solana/web3.js';

export const BPF_UPGRADEABLE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
);

export interface VerificationStatus {
  isProgram: boolean;
  isExecutable: boolean;
  isUpgradeableLoader: boolean;
  reason?: string;
}

export function verifyProgramAccount(
  accountInfo: AccountInfo<Buffer> | null
): VerificationStatus {
  if (!accountInfo) {
    return {
      isProgram: false,
      isExecutable: false,
      isUpgradeableLoader: false,
      reason: 'Account does not exist on network',
    };
  }

  const isExecutable = accountInfo.executable;
  const isUpgradeableLoader = accountInfo.owner.equals(BPF_UPGRADEABLE_LOADER_ID);
  const isProgram = isExecutable && isUpgradeableLoader;

  return {
    isProgram,
    isExecutable,
    isUpgradeableLoader,
    reason: isProgram ? 'Valid BPF Upgradeable Program' : 'Not a valid deployed program',
  };
}`,
    testCases: [
      {
        id: 'test-1',
        name: 'Validates executable BPF Upgradeable Program',
        description: 'Returns isProgram: true when executable is true and owner is BPF Loader.'
      },
      {
        id: 'test-2',
        name: 'Rejects non-executable data accounts',
        description: 'Returns isProgram: false when executable is false.'
      },
      {
        id: 'test-3',
        name: 'Rejects non-BPF Loader ownership',
        description: 'Returns isProgram: false if owned by SystemProgram.'
      }
    ],
    hints: [
      'Check `accountInfo.executable === true`.',
      'Compare `accountInfo.owner.equals(BPF_UPGRADEABLE_LOADER_ID)`.',
      '`isProgram` is true only when both conditions are satisfied.'
    ],
    docLinks: [
      { title: 'Solana Docs: Deployed Programs', url: 'https://docs.solana.com/cli/deploy-a-program' }
    ]
  }
];
