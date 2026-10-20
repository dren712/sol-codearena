const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initialChallenges = [
  {
    id: '01-wallets',
    slug: '01-wallets',
    title: 'Wallets & Keypairs',
    order: 1,
    category: 'foundations',
    difficulty: 'beginner',
    points: 100,
    description: 'Learn how Solana wallets, Ed25519 keypairs, and digital signatures function under the hood.',
    starterCode: `import { Keypair, PublicKey } from '@solana/web3.js';\nimport nacl from 'tweetnacl';\n\nexport interface SignResult {\n  publicKey: string;\n  signature: Uint8Array;\n  verified: boolean;\n}\n\nexport function generateAndSignMessage(message: string): SignResult {\n  // TODO: 1. Generate a new Keypair\n  // TODO: 2. Convert message into Uint8Array bytes using TextEncoder\n  // TODO: 3. Create a detached signature using nacl.sign.detached\n  // TODO: 4. Verify the signature using nacl.sign.detached.verify\n  // TODO: 5. Return { publicKey, signature, verified }\n\n  return {\n    publicKey: '',\n    signature: new Uint8Array(),\n    verified: false,\n  };\n}`,
    solutionTemplate: `import { Keypair, PublicKey } from '@solana/web3.js';\nimport nacl from 'tweetnacl';\n\nexport interface SignResult {\n  publicKey: string;\n  signature: Uint8Array;\n  verified: boolean;\n}\n\nexport function generateAndSignMessage(message: string): SignResult {\n  const keypair = Keypair.generate();\n  const messageBytes = new TextEncoder().encode(message);\n  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);\n  const verified = nacl.sign.detached.verify(messageBytes, signature, keypair.publicKey.toBytes());\n\n  return {\n    publicKey: keypair.publicKey.toBase58(),\n    signature,\n    verified,\n  };\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Generate valid Base58 public key', description: 'Returned publicKey must be a valid 32-44 character Base58 Solana address.' },
      { id: 'test-2', name: 'Produce 64-byte Ed25519 signature', description: 'The detached signature must be exactly 64 bytes.' },
      { id: 'test-3', name: 'Cryptographic signature verification passes', description: 'Verification of message against public key and signature must return true.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'Ed25519 Keypairs & Addresses',
        content: 'On Solana, an account or wallet address is a 32-byte Ed25519 public key, usually formatted in Base58. The secret key is a 64-byte array used to produce unforgeable cryptographic signatures.',
        diagram: 'Private Key (64B) ──[Ed25519 Sign]──> Signature (64B)\nPublic Key (32B)  ──[Verify]─────────> Valid/Invalid (boolean)'
      }
    ]),
  },
  {
    id: '02-transactions',
    slug: '02-transactions',
    title: 'Transactions & Transfers',
    order: 2,
    category: 'foundations',
    difficulty: 'beginner',
    points: 100,
    description: 'Learn how Solana transactions are constructed with instructions, fee payers, and recent blockhashes.',
    starterCode: `import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';\n\nexport function buildTransferTransaction(\n  fromPubkey: PublicKey,\n  toPubkey: PublicKey,\n  lamports: number,\n  recentBlockhash: string\n): Transaction {\n  // TODO: Add SystemProgram.transfer, set feePayer and recentBlockhash\n  return new Transaction();\n}`,
    solutionTemplate: `import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';\n\nexport function buildTransferTransaction(\n  fromPubkey: PublicKey,\n  toPubkey: PublicKey,\n  lamports: number,\n  recentBlockhash: string\n): Transaction {\n  const tx = new Transaction();\n  tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));\n  tx.feePayer = fromPubkey;\n  tx.recentBlockhash = recentBlockhash;\n  return tx;\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Contains SystemProgram.transfer instruction', description: 'Transaction should have 1 instruction belonging to SystemProgram.' },
      { id: 'test-2', name: 'Fee payer properly assigned', description: 'tx.feePayer must equal the fromPubkey parameter.' },
      { id: 'test-3', name: 'Blockhash properly assigned', description: 'tx.recentBlockhash must match the provided blockhash string.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'Solana Transaction Model',
        content: 'A Solana transaction is an atomic bundle of instructions executed sequentially. If any instruction fails, all state changes revert.',
        diagram: 'Transaction\n ├── feePayer: PublicKey\n ├── recentBlockhash: string\n └── instructions: [ SystemProgram.transfer(...) ]'
      }
    ]),
  },
  {
    id: '03-accounts',
    slug: '03-accounts',
    title: 'Accounts & State',
    order: 3,
    category: 'foundations',
    difficulty: 'beginner',
    points: 100,
    description: 'Understand the fundamental Solana account model: lamports, ownership, executable flag, and rent.',
    starterCode: `import { AccountInfo, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';\n\nexport interface AccountReport {\n  solBalance: number;\n  isExecutable: boolean;\n  isSystemOwned: boolean;\n  dataLength: number;\n  ownerAddress: string;\n}\n\nexport function inspectAccount(accountInfo: AccountInfo<Buffer> | null): AccountReport | null {\n  if (!accountInfo) return null;\n  // TODO: Inspect account\n  return { solBalance: 0, isExecutable: false, isSystemOwned: false, dataLength: 0, ownerAddress: '' };\n}`,
    solutionTemplate: `import { AccountInfo, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';\n\nexport function inspectAccount(accountInfo: AccountInfo<Buffer> | null) {\n  if (!accountInfo) return null;\n  return {\n    solBalance: accountInfo.lamports / LAMPORTS_PER_SOL,\n    isExecutable: accountInfo.executable,\n    isSystemOwned: accountInfo.owner.equals(SystemProgram.programId),\n    dataLength: accountInfo.data.length,\n    ownerAddress: accountInfo.owner.toBase58(),\n  };\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Correct SOL balance calculation', description: '2,500,000,000 lamports must convert to 2.5 SOL.' },
      { id: 'test-2', name: 'SystemProgram ownership check', description: 'Returns isSystemOwned: true when owner is SystemProgram.' },
      { id: 'test-3', name: 'Handles null account properly', description: 'Returns null when account does not exist.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'Everything is an Account',
        content: 'Solana programs are stateless. State is stored in accounts owned by those programs.',
        diagram: 'Account: lamports + owner + executable + data Buffer'
      }
    ]),
  },
  {
    id: '04-pdas',
    slug: '04-pdas',
    title: 'Program Derived Addresses (PDAs)',
    order: 4,
    category: 'programs',
    difficulty: 'intermediate',
    points: 150,
    description: 'The flagship Solana concept! Learn how deterministic off-curve addresses are derived from seeds.',
    starterCode: `import { PublicKey } from '@solana/web3.js';\n\nexport function deriveUserPda(wallet: PublicKey, programId: PublicKey): [PublicKey, number] {\n  // TODO: Derive PDA with seeds ["user", wallet.toBuffer()]\n  return [PublicKey.default, 0];\n}`,
    solutionTemplate: `import { PublicKey } from '@solana/web3.js';\n\nexport function deriveUserPda(wallet: PublicKey, programId: PublicKey): [PublicKey, number] {\n  return PublicKey.findProgramAddressSync([Buffer.from('user'), wallet.toBuffer()], programId);\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Derives deterministic off-curve PDA', description: 'PDA must not lie on the Ed25519 elliptic curve.' },
      { id: 'test-2', name: 'Returns valid bump seed (0-255)', description: 'Canonical bump must be an integer between 0 and 255.' },
      { id: 'test-3', name: 'Matches expected reference PDA for test wallet', description: 'Given wallet and programId, derived address must match ground truth.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'What is a PDA?',
        content: 'PDAs are deterministic addresses off the Ed25519 curve. They have no private keys and can only be signed for by the originating program via invoke_signed.',
        diagram: 'Seeds: ["user", walletPubkey] + Program ID ──> findProgramAddressSync ──> [PDA, bump]'
      }
    ]),
  },
  {
    id: '05-instructions',
    slug: '05-instructions',
    title: 'Custom Program Instructions',
    order: 5,
    category: 'programs',
    difficulty: 'intermediate',
    points: 120,
    description: 'Learn how low-level Solana instructions are packed with AccountMeta arrays and binary instruction data.',
    starterCode: `import { TransactionInstruction, PublicKey } from '@solana/web3.js';\n\nexport function buildArenaInstruction(programId: PublicKey, userWallet: PublicKey, pdaAccount: PublicKey, actionTag: number): TransactionInstruction {\n  // TODO: Build instruction\n  return new TransactionInstruction({ keys: [], programId, data: Buffer.alloc(0) });\n}`,
    solutionTemplate: `import { TransactionInstruction, PublicKey } from '@solana/web3.js';\n\nexport function buildArenaInstruction(programId: PublicKey, userWallet: PublicKey, pdaAccount: PublicKey, actionTag: number): TransactionInstruction {\n  return new TransactionInstruction({\n    keys: [\n      { pubkey: userWallet, isSigner: true, isWritable: true },\n      { pubkey: pdaAccount, isSigner: false, isWritable: true }\n    ],\n    programId,\n    data: Buffer.from([actionTag])\n  });\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Contains correct AccountMeta permissions', description: 'User must be signer+writable; PDA must be non-signer+writable.' },
      { id: 'test-2', name: 'Packs actionTag into binary buffer', description: 'instruction.data[0] must equal actionTag.' },
      { id: 'test-3', name: 'Targets correct programId', description: 'instruction.programId matches target program.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'TransactionInstruction Anatomy',
        content: 'Every instruction specifies programId, keys (AccountMeta with pubkey, isSigner, isWritable), and data Buffer.',
        diagram: 'Instruction: programId + AccountMeta[] + data Buffer'
      }
    ]),
  },
  {
    id: '06-anchor',
    slug: '06-anchor',
    title: 'Anchor Framework & Discriminators',
    order: 6,
    category: 'programs',
    difficulty: 'intermediate',
    points: 150,
    description: 'Learn how Anchor uses 8-byte instruction and account discriminators derived from SHA-256 hashes.',
    starterCode: `import { createHash } from 'crypto';\n\nexport function calculateAnchorDiscriminator(instructionName: string): Buffer {\n  // TODO: sha256("global:" + instructionName)[0..8]\n  return Buffer.alloc(8);\n}`,
    solutionTemplate: `import { createHash } from 'crypto';\n\nexport function calculateAnchorDiscriminator(instructionName: string): Buffer {\n  return createHash('sha256').update(\`global:\${instructionName}\`).digest().subarray(0, 8);\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Returns exactly 8 bytes buffer', description: 'Result length must be exactly 8 bytes.' },
      { id: 'test-2', name: 'Matches known Anchor discriminator for initialize_user', description: 'Produces correct 8-byte discriminator for initialize_user.' },
      { id: 'test-3', name: 'Matches known Anchor discriminator for record_completion', description: 'Produces correct 8-byte discriminator for record_completion.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'Anchor Instruction Discriminator',
        content: 'Anchor prefixes every instruction call with an 8-byte discriminator computed from sha256("global:<method_name>").',
        diagram: '"global:record_completion" ──[SHA256]──> first 8 bytes = 0x8a14ef49b2c1903d'
      }
    ]),
  },
  {
    id: '07-spl-tokens',
    slug: '07-spl-tokens',
    title: 'SPL Tokens & Decimals',
    order: 7,
    category: 'tokens',
    difficulty: 'intermediate',
    points: 120,
    description: 'Learn how SPL Tokens work: Mint accounts, decimal precision, and converting UI human amounts to raw integer units.',
    starterCode: `export function uiAmountToRawUnits(amountUi: number, decimals: number): bigint {\n  // TODO: Convert decimal human amount to raw bigint\n  return 0n;\n}\n\nexport function rawUnitsToUi(rawUnits: bigint, decimals: number): number {\n  // TODO: Convert raw bigint back to human float\n  return 0;\n}`,
    solutionTemplate: `export function uiAmountToRawUnits(amountUi: number, decimals: number): bigint {\n  return BigInt(Math.round(amountUi * (10 ** decimals)));\n}\n\nexport function rawUnitsToUi(rawUnits: bigint, decimals: number): number {\n  return Number(rawUnits) / (10 ** decimals);\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Converts 1.5 USDC (6 decimals) to 1500000n', description: '1.5 with 6 decimals must equal 1500000n.' },
      { id: 'test-2', name: 'Converts 2.75 SOL (9 decimals) to 2750000000n', description: '2.75 with 9 decimals must equal 2750000000n.' },
      { id: 'test-3', name: 'Converts raw base units back to UI amount', description: '1500000n with 6 decimals must equal 1.5.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'SPL Token Precision',
        content: 'All token balances on Solana are stored as u64 integers. Decimals specify the fractional power of ten.',
        diagram: '1.5 USDC (decimals=6) = 1,500,000 raw integer units'
      }
    ]),
  },
  {
    id: '08-token-accounts',
    slug: '08-token-accounts',
    title: 'Associated Token Accounts (ATAs)',
    order: 8,
    category: 'tokens',
    difficulty: 'intermediate',
    points: 130,
    description: 'Learn how Associated Token Accounts (ATAs) deterministically map a user wallet and mint address to a token balance account.',
    starterCode: `import { PublicKey } from '@solana/web3.js';\nexport const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');\nexport const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');\n\nexport function deriveAssociatedTokenAccount(wallet: PublicKey, mint: PublicKey): PublicKey {\n  // TODO: Derive ATA\n  return PublicKey.default;\n}`,
    solutionTemplate: `import { PublicKey } from '@solana/web3.js';\nexport const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');\nexport const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');\n\nexport function deriveAssociatedTokenAccount(wallet: PublicKey, mint: PublicKey): PublicKey {\n  const [ata] = PublicKey.findProgramAddressSync([wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID);\n  return ata;\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Produces off-curve PDA', description: 'Derived ATA must be off-curve.' },
      { id: 'test-2', name: 'Matches SPL Token getAssociatedTokenAddressSync', description: 'Matches standard Solana ATA address.' },
      { id: 'test-3', name: 'Deterministic across repeated calls', description: 'Repeated calls yield identical address.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'Deterministic Token Accounts',
        content: 'Associated Token Accounts ensure each wallet has exactly one canonical token account per mint.',
        diagram: 'Seeds: [wallet, TokenProgram, mint] ──> ATA address'
      }
    ]),
  },
  {
    id: '09-cpi',
    slug: '09-cpi',
    title: 'Cross-Program Invocation (CPI)',
    order: 9,
    category: 'advanced',
    difficulty: 'advanced',
    points: 180,
    description: 'Learn how Solana programs call other programs using Cross-Program Invocations and pass privileged signers.',
    starterCode: `import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';\n\nexport function buildCpiTransferInstruction(fromPubkey: PublicKey, toPubkey: PublicKey, lamports: number) {\n  // TODO: Return CPI details\n  return {\n    calleeProgramId: '',\n    accountsCount: 0,\n    isPayerWritable: false,\n    isRecipientWritable: false,\n    instruction: new TransactionInstruction({ keys: [], programId: PublicKey.default })\n  };\n}`,
    solutionTemplate: `import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';\n\nexport function buildCpiTransferInstruction(fromPubkey: PublicKey, toPubkey: PublicKey, lamports: number) {\n  const instruction = SystemProgram.transfer({ fromPubkey, toPubkey, lamports });\n  return {\n    calleeProgramId: instruction.programId.toBase58(),\n    accountsCount: instruction.keys.length,\n    isPayerWritable: instruction.keys[0].isWritable,\n    isRecipientWritable: instruction.keys[1].isWritable,\n    instruction,\n  };\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Targets System Program as callee', description: 'Callee program ID must equal SystemProgram.' },
      { id: 'test-2', name: 'Marks both payer and recipient accounts as writable', description: 'Both accounts must have isWritable: true.' },
      { id: 'test-3', name: 'Instruction data contains encoded transfer lamports', description: 'Data buffer length is 12 bytes.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'Cross-Program Invocation',
        content: 'CPI allows Solana programs to invoke instructions on other programs. Privileges extend via invoke_signed.',
        diagram: 'Program A ──[CPI invoke]──> Program B'
      }
    ]),
  },
  {
    id: '10-deploy',
    slug: '10-deploy',
    title: 'Deploy & Verify',
    order: 10,
    category: 'advanced',
    difficulty: 'advanced',
    points: 200,
    description: 'Learn how Solana programs are deployed as BPF Upgradeable accounts and verify program status on Devnet.',
    starterCode: `import { AccountInfo, PublicKey } from '@solana/web3.js';\nexport const BPF_UPGRADEABLE_LOADER_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');\n\nexport function verifyProgramAccount(accountInfo: AccountInfo<Buffer> | null) {\n  // TODO: verify executable and owner\n  return { isProgram: false, isExecutable: false, isUpgradeableLoader: false };\n}`,
    solutionTemplate: `import { AccountInfo, PublicKey } from '@solana/web3.js';\nexport const BPF_UPGRADEABLE_LOADER_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');\n\nexport function verifyProgramAccount(accountInfo: AccountInfo<Buffer> | null) {\n  if (!accountInfo) return { isProgram: false, isExecutable: false, isUpgradeableLoader: false, reason: 'Missing account' };\n  const isProgram = accountInfo.executable && accountInfo.owner.equals(BPF_UPGRADEABLE_LOADER_ID);\n  return { isProgram, isExecutable: accountInfo.executable, isUpgradeableLoader: accountInfo.owner.equals(BPF_UPGRADEABLE_LOADER_ID) };\n}`,
    testCases: JSON.stringify([
      { id: 'test-1', name: 'Validates executable BPF Upgradeable Program', description: 'Returns isProgram: true when executable and owned by BPF Loader.' },
      { id: 'test-2', name: 'Rejects non-executable data accounts', description: 'Returns isProgram: false when executable is false.' },
      { id: 'test-3', name: 'Rejects non-BPF Loader ownership', description: 'Returns isProgram: false if owned by SystemProgram.' }
    ]),
    concepts: JSON.stringify([
      {
        title: 'BPF Upgradeable Loader',
        content: 'Programs on Solana are executable accounts owned by the BPF Upgradeable Loader pointing to compiled bytecode.',
        diagram: 'Program Account (executable=true, owner=BPF Loader) ──> ProgramData Account'
      }
    ]),
  },
];

async function main() {
  console.log('Seeding Code Arena database...');

  // Upsert challenges
  for (const c of initialChallenges) {
    await prisma.challenge.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }
  console.log(`✓ Seeded ${initialChallenges.length} challenges.`);

  // Demo Leaderboard Users
  const demoUsers = [
    {
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      username: 'Alice_Sol',
      completedCount: 9,
      totalScore: 1150,
    },
    {
      walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      username: 'Bob_RustDev',
      completedCount: 8,
      totalScore: 980,
    },
    {
      walletAddress: 'CodenL9a8LqfB58MfqEaU85GkL9a8LqfB58MfqEaU85G',
      username: 'Darshan',
      completedCount: 7,
      totalScore: 870,
    },
    {
      walletAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      username: 'Elena_Anchor',
      completedCount: 5,
      totalScore: 620,
    },
    {
      walletAddress: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
      username: 'DevnetHacker',
      completedCount: 4,
      totalScore: 470,
    },
  ];

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { walletAddress: u.walletAddress },
      update: {
        username: u.username,
        completedCount: u.completedCount,
        totalScore: u.totalScore,
      },
      create: u,
    });

    // Add a completion for the PDA challenge for Alice and Darshan.
    // NOTE: honest demo data — the program is not deployed, so these completions
    // are recorded locally and NOT marked as on-chain verified. A fabricated
    // signature here would show a "verified" badge whose explorer link 404s, in
    // a class about on-chain proof.
    if (u.username === 'Alice_Sol' || u.username === 'Darshan') {
      await prisma.completion.upsert({
        where: {
          userId_challengeId: {
            userId: user.id,
            challengeId: '04-pdas',
          },
        },
        // Reset stale fake proof from older seeds as well as new installs.
        update: { txSignature: null, verified: false },
        create: {
          userId: user.id,
          challengeId: '04-pdas',
          txSignature: null,
          verified: false,
        },
      });
    }
  }

  console.log(`✓ Seeded ${demoUsers.length} leaderboard builders.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
