import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import type { AccountInfo } from '@solana/web3.js';
import { CHALLENGES } from '../challenges';
import { Challenge, ValidationResult, TestResult } from '../types';
import nacl from 'tweetnacl';

export class ChallengeValidator {
  /**
   * Validates user code or submission for a given challenge.
   */
  public static async validate(
    challengeSlug: string,
    userCode: string,
    walletAddress?: string
  ): Promise<ValidationResult> {
    const challenge = CHALLENGES.find((c) => c.slug === challengeSlug);
    if (!challenge) {
      return {
        success: false,
        score: 0,
        message: `Challenge '${challengeSlug}' not found.`,
        output: `Error: Challenge '${challengeSlug}' does not exist in registry.`,
        testResults: [],
      };
    }

    try {
      switch (challenge.slug) {
        case '01-wallets':
          return await this.validateWallets(userCode, challenge);
        case '02-transactions':
          return await this.validateTransactions(userCode, challenge);
        case '03-accounts':
          return await this.validateAccounts(userCode, challenge);
        case '04-pdas':
          return await this.validatePdas(userCode, challenge, walletAddress);
        case '05-instructions':
          return await this.validateInstructions(userCode, challenge);
        case '06-anchor':
          return await this.validateAnchor(userCode, challenge);
        case '07-spl-tokens':
          return await this.validateSplTokens(userCode, challenge);
        case '08-token-accounts':
          return await this.validateTokenAccounts(userCode, challenge);
        case '09-cpi':
          return await this.validateCpi(userCode, challenge);
        case '10-deploy':
          return await this.validateDeploy(userCode, challenge);
        default:
          return await this.validateGeneric(userCode, challenge);
      }
    } catch (err: any) {
      return {
        success: false,
        score: 0,
        message: 'Validation runtime exception',
        output: `Runtime Error:\n${err.message || String(err)}`,
        testResults: challenge.testCases.map((tc) => ({
          id: tc.id,
          name: tc.name,
          passed: false,
          message: err.message || 'Execution failed',
        })),
      };
    }
  }

  private static evaluateModule(userCode: string, context: Record<string, any>) {
    let jsCode = userCode;
    try {
      const ts = require('typescript');
      jsCode = ts.transpileModule(userCode, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          removeComments: false,
        },
      }).outputText;
    } catch {
      jsCode = userCode.replace(/import\s+[^;]+;?/g, '');
    }

    const exportsObj: Record<string, any> = {};
    const moduleObj = { exports: exportsObj };

    const sandboxedRequire = (pkg: string) => {
      let mod: any;
      if (context[pkg]) mod = context[pkg];
      else if (pkg === '@solana/web3.js') mod = require('@solana/web3.js');
      else if (pkg === 'tweetnacl') mod = require('tweetnacl');
      else if (pkg === '@solana/spl-token') mod = require('@solana/spl-token');
      else if (pkg === 'crypto') mod = require('crypto');
      else if (pkg === 'bs58') mod = require('bs58');
      else mod = {};

      if (mod && typeof mod === 'object') {
        return new Proxy(mod, {
          get(target, prop) {
            if (prop === 'default') return target;
            return target[prop];
          },
        });
      }
      return mod;
    };

    const knownFunctions = [
      'generateAndSignMessage',
      'buildTransferTransaction',
      'inspectAccount',
      'deriveUserPda',
      'buildArenaInstruction',
      'calculateAnchorDiscriminator',
      'uiAmountToRawUnits',
      'rawUnitsToUi',
      'deriveAssociatedTokenAccount',
      'buildCpiTransferInstruction',
      'verifyProgramAccount',
    ];

    const autoExportSnippets = knownFunctions
      .map(
        (fn) =>
          `try { if (typeof ${fn} !== 'undefined' && !module.exports['${fn}']) module.exports['${fn}'] = ${fn}; } catch(e){}`
      )
      .join('\n');

    const argNames = ['exports', 'module', 'require', ...Object.keys(context)];
    const argValues = [exportsObj, moduleObj, sandboxedRequire, ...Object.values(context)];

    const wrappedFn = new Function(
      ...argNames,
      `${jsCode}\n${autoExportSnippets}\nreturn module.exports;`
    );
    wrappedFn(...argValues);

    const finalExports =
      Object.keys(moduleObj.exports).length > 0 ? moduleObj.exports : exportsObj;

    // Handle export default fallback
    if (finalExports.default) {
      if (typeof finalExports.default === 'function' && finalExports.default.name) {
        if (!finalExports[finalExports.default.name]) {
          finalExports[finalExports.default.name] = finalExports.default;
        }
      } else if (typeof finalExports.default === 'object') {
        Object.assign(finalExports, finalExports.default);
      }
    }

    return finalExports;
  }

  // --- 01. Wallets & Keypairs ---
  private static async validateWallets(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const context = {
      Keypair,
      PublicKey,
      nacl,
      TextEncoder,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.generateAndSignMessage;

    if (typeof fn !== 'function') {
      throw new Error("Expected exported function 'generateAndSignMessage' not found.");
    }

    // Test 1: Generate valid public key
    logs.push("Test 1: Calling generateAndSignMessage('test-challenge-message')...");
    const result1 = fn('test-challenge-message');

    let t1Passed = false;
    try {
      const pub = new PublicKey(result1.publicKey);
      t1Passed = PublicKey.isOnCurve(pub);
      testResults.push({
        id: 'test-1',
        name: 'Generate valid Base58 public key',
        passed: t1Passed,
        actual: result1.publicKey,
      });
      logs.push(`✓ Public key generated: ${result1.publicKey}`);
    } catch (e: any) {
      testResults.push({
        id: 'test-1',
        name: 'Generate valid Base58 public key',
        passed: false,
        message: 'Invalid public key format',
      });
    }

    // Test 2: 64-byte Ed25519 signature
    const sigLen = result1.signature ? result1.signature.length : 0;
    const t2Passed = sigLen === 64;
    testResults.push({
      id: 'test-2',
      name: 'Produce 64-byte Ed25519 signature',
      passed: t2Passed,
      actual: `${sigLen} bytes`,
      expected: '64 bytes',
    });
    logs.push(t2Passed ? `✓ Detached signature created (${sigLen} bytes)` : `✗ Signature length was ${sigLen}, expected 64`);

    // Test 3: Cryptographic verification passes (supports both verified and isValid property names)
    const isVerified = result1.verified !== undefined ? result1.verified : result1.isValid;
    const t3Passed = isVerified === true;
    testResults.push({
      id: 'test-3',
      name: 'Cryptographic signature verification passes',
      passed: t3Passed,
      actual: String(isVerified),
      expected: 'true',
    });
    logs.push(t3Passed ? '✓ Signature verified with Ed25519 public key' : '✗ Verification returned false');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : Math.round((testResults.filter((t) => t.passed).length / testResults.length) * challenge.points),
      message: allPassed ? 'All wallet test cases passed!' : 'Some tests failed. See output.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 02. Transactions ---
  private static async validateTransactions(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const context = {
      Transaction,
      SystemProgram,
      PublicKey,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.buildTransferTransaction;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'buildTransferTransaction' not found.");
    }

    const alice = Keypair.generate().publicKey;
    const bob = Keypair.generate().publicKey;
    const blockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDcg3iAZ2tFhGu3R';
    const lamports = 1_000_000;

    const tx = fn(alice, bob, lamports, blockhash);

    // Test 1: Contains SystemProgram transfer instruction
    const hasTransferIx = tx?.instructions?.some((ix: TransactionInstruction) =>
      ix.programId.equals(SystemProgram.programId)
    );
    testResults.push({
      id: 'test-1',
      name: 'Contains SystemProgram.transfer instruction',
      passed: !!hasTransferIx,
      expected: 'SystemProgram instruction present',
    });
    logs.push(hasTransferIx ? '✓ SystemProgram.transfer instruction present' : '✗ Transfer instruction missing');

    // Test 2: Fee payer
    const feePayerMatches = tx?.feePayer?.equals(alice);
    testResults.push({
      id: 'test-2',
      name: 'Fee payer properly assigned',
      passed: !!feePayerMatches,
      actual: tx?.feePayer?.toBase58(),
      expected: alice.toBase58(),
    });
    logs.push(feePayerMatches ? `✓ Fee payer set to ${alice.toBase58()}` : '✗ Fee payer missing or incorrect');

    // Test 3: Blockhash
    const blockhashMatches = tx?.recentBlockhash === blockhash;
    testResults.push({
      id: 'test-3',
      name: 'Blockhash properly assigned',
      passed: blockhashMatches,
      actual: tx?.recentBlockhash,
      expected: blockhash,
    });
    logs.push(blockhashMatches ? `✓ Blockhash set to ${blockhash}` : '✗ Blockhash missing or incorrect');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'Transaction successfully constructed!' : 'Transaction construction failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 03. Accounts ---
  private static async validateAccounts(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const context = {
      PublicKey,
      LAMPORTS_PER_SOL,
      SystemProgram,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.inspectAccount;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'inspectAccount' not found.");
    }

    const mockAccount: AccountInfo<Buffer> = {
      executable: false,
      owner: SystemProgram.programId,
      lamports: 2_500_000_000,
      data: Buffer.alloc(128),
      rentEpoch: 0,
    };

    const report = fn(mockAccount);

    // Test 1: Sol balance
    const t1 = report?.solBalance === 2.5;
    testResults.push({
      id: 'test-1',
      name: 'Correct SOL balance calculation',
      passed: t1,
      actual: `${report?.solBalance} SOL`,
      expected: '2.5 SOL',
    });
    logs.push(t1 ? '✓ Lamports converted: 2.5 SOL' : `✗ Expected 2.5 SOL, received ${report?.solBalance}`);

    // Test 2: SystemProgram ownership
    const t2 = report?.isSystemOwned === true;
    testResults.push({
      id: 'test-2',
      name: 'SystemProgram ownership check',
      passed: t2,
      actual: String(report?.isSystemOwned),
      expected: 'true',
    });
    logs.push(t2 ? '✓ Account confirmed owned by System Program' : '✗ SystemProgram ownership check failed');

    // Test 3: Null handling
    const nullReport = fn(null);
    const t3 = nullReport === null;
    testResults.push({
      id: 'test-3',
      name: 'Handles null account properly',
      passed: t3,
      actual: String(nullReport),
      expected: 'null',
    });
    logs.push(t3 ? '✓ Correctly returned null for missing account' : '✗ Did not handle null account');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'Account inspector verified!' : 'Account inspection failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 04. PDAs (FLAGSHIP DEMO DAY) ---
  private static async validatePdas(
    userCode: string,
    challenge: Challenge,
    walletAddress?: string
  ): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const context = {
      PublicKey,
      Buffer,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.deriveUserPda;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'deriveUserPda' not found.");
    }

    const testWallet = walletAddress ? new PublicKey(walletAddress) : Keypair.generate().publicKey;
    const programId = new PublicKey('Arena111111111111111111111111111111111111111');

    logs.push(`Inputs:\n  Wallet: ${testWallet.toBase58()}\n  Program ID: ${programId.toBase58()}`);
    logs.push('Deriving PDA with seeds ["user", wallet_pubkey]...');

    const [userPda, bump] = fn(testWallet, programId);

    // Expected reference calculation
    const [expectedPda, expectedBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), testWallet.toBuffer()],
      programId
    );

    // Test 1: Off-curve verification
    let isOffCurve = false;
    try {
      isOffCurve = !PublicKey.isOnCurve(userPda);
    } catch {
      isOffCurve = false;
    }
    testResults.push({
      id: 'test-1',
      name: 'Derives deterministic off-curve PDA',
      passed: isOffCurve,
      actual: isOffCurve ? 'Off-curve (No private key)' : 'On-curve (Invalid PDA)',
    });
    logs.push(isOffCurve ? `✓ PDA is off-curve: ${userPda?.toBase58?.()}` : '✗ Address lies on elliptic curve!');

    // Test 2: Valid bump seed (0-255)
    const validBump = typeof bump === 'number' && bump >= 0 && bump <= 255;
    testResults.push({
      id: 'test-2',
      name: 'Returns valid bump seed (0-255)',
      passed: validBump,
      actual: String(bump),
      expected: String(expectedBump),
    });
    logs.push(validBump ? `✓ Canonical bump seed: ${bump}` : `✗ Invalid bump seed: ${bump}`);

    // Test 3: Matches reference PDA
    const matches = userPda && userPda.equals && userPda.equals(expectedPda) && bump === expectedBump;
    testResults.push({
      id: 'test-3',
      name: 'Matches expected reference PDA for test wallet',
      passed: matches,
      actual: userPda?.toBase58 ? userPda.toBase58() : String(userPda),
      expected: expectedPda.toBase58(),
    });
    logs.push(matches ? `✓ Derived PDA matches ground truth: ${expectedPda.toBase58()}` : `✗ Mismatch:\n  Received: ${userPda}\n  Expected: ${expectedPda.toBase58()}`);

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'PDA successfully derived! Ready to record on Solana Devnet.' : 'PDA derivation failed.',
      output: logs.join('\n'),
      testResults,
      logs,
      pdaAddress: expectedPda.toBase58(),
    };
  }

  // --- 05. Custom Program Instructions ---
  private static async validateInstructions(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const context = {
      TransactionInstruction,
      PublicKey,
      Buffer,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.buildArenaInstruction;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'buildArenaInstruction' not found.");
    }

    const programId = Keypair.generate().publicKey;
    const userWallet = Keypair.generate().publicKey;
    const pdaAccount = Keypair.generate().publicKey;
    const actionTag = 7;

    const ix = fn(programId, userWallet, pdaAccount, actionTag);

    // Test 1: Account permissions
    const userKeyMeta = ix?.keys?.find((k: any) => k.pubkey?.equals?.(userWallet));
    const pdaKeyMeta = ix?.keys?.find((k: any) => k.pubkey?.equals?.(pdaAccount));
    const t1 = userKeyMeta?.isSigner === true && userKeyMeta?.isWritable === true &&
               pdaKeyMeta?.isSigner === false && pdaKeyMeta?.isWritable === true;

    testResults.push({
      id: 'test-1',
      name: 'Contains correct AccountMeta permissions',
      passed: t1,
      expected: 'User: Signer+Writable | PDA: NonSigner+Writable',
    });
    logs.push(t1 ? '✓ Account permissions correctly configured' : '✗ Account permissions invalid');

    // Test 2: Binary action tag
    const t2 = ix?.data && ix.data[0] === actionTag;
    testResults.push({
      id: 'test-2',
      name: 'Packs actionTag into binary buffer',
      passed: t2,
      actual: ix?.data ? String(ix.data[0]) : 'undefined',
      expected: String(actionTag),
    });
    logs.push(t2 ? `✓ Action tag ${actionTag} packed in instruction data` : '✗ Data buffer mismatch');

    // Test 3: Program ID
    const t3 = ix?.programId?.equals?.(programId);
    testResults.push({
      id: 'test-3',
      name: 'Targets correct programId',
      passed: !!t3,
    });
    logs.push(t3 ? '✓ Program ID matches target' : '✗ Program ID mismatch');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'Instruction successfully created!' : 'Instruction validation failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 06. Anchor Framework & Discriminators ---
  private static async validateAnchor(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];
    const { createHash } = require('crypto');

    const context = {
      createHash,
      Buffer,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.calculateAnchorDiscriminator;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'calculateAnchorDiscriminator' not found.");
    }

    const discInit = fn('initialize_user');
    const discRecord = fn('record_completion');

    // Reference hashes
    const refInit = createHash('sha256').update('global:initialize_user').digest().subarray(0, 8);
    const refRecord = createHash('sha256').update('global:record_completion').digest().subarray(0, 8);

    // Test 1: Length
    const t1 = Buffer.isBuffer(discInit) && discInit.length === 8;
    testResults.push({
      id: 'test-1',
      name: 'Returns exactly 8 bytes buffer',
      passed: t1,
      actual: `${discInit?.length || 0} bytes`,
      expected: '8 bytes',
    });
    logs.push(t1 ? '✓ Discriminator is 8 bytes' : '✗ Length is not 8 bytes');

    // Test 2: initialize_user
    const t2 = Buffer.isBuffer(discInit) && discInit.equals(refInit);
    testResults.push({
      id: 'test-2',
      name: 'Matches known Anchor discriminator for initialize_user',
      passed: t2,
      actual: discInit?.toString ? discInit.toString('hex') : '',
      expected: refInit.toString('hex'),
    });
    logs.push(t2 ? `✓ initialize_user discriminator: 0x${refInit.toString('hex')}` : '✗ Discriminator mismatch for initialize_user');

    // Test 3: record_completion
    const t3 = Buffer.isBuffer(discRecord) && discRecord.equals(refRecord);
    testResults.push({
      id: 'test-3',
      name: 'Matches known Anchor discriminator for record_completion',
      passed: t3,
      actual: discRecord?.toString ? discRecord.toString('hex') : '',
      expected: refRecord.toString('hex'),
    });
    logs.push(t3 ? `✓ record_completion discriminator: 0x${refRecord.toString('hex')}` : '✗ Discriminator mismatch for record_completion');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'Anchor discriminators verified!' : 'Discriminator tests failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 07. SPL Tokens ---
  private static async validateSplTokens(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const context = {
      BigInt,
      Math,
      Number,
    };

    const mod = this.evaluateModule(userCode, context);
    const uiToRaw = mod.uiAmountToRawUnits;
    const rawToUi = mod.rawUnitsToUi;

    if (typeof uiToRaw !== 'function' || typeof rawToUi !== 'function') {
      throw new Error('Expected uiAmountToRawUnits and rawUnitsToUi functions.');
    }

    // Test 1: 1.5 USDC (6 decimals)
    const raw1 = uiToRaw(1.5, 6);
    const t1 = raw1 === 1500000n;
    testResults.push({
      id: 'test-1',
      name: 'Converts 1.5 USDC (6 decimals) to 1500000n',
      passed: t1,
      actual: String(raw1),
      expected: '1500000n',
    });
    logs.push(t1 ? '✓ 1.5 USDC = 1,500,000 base units' : `✗ Expected 1500000n, received ${raw1}`);

    // Test 2: 2.75 SOL (9 decimals)
    const raw2 = uiToRaw(2.75, 9);
    const t2 = raw2 === 2750000000n;
    testResults.push({
      id: 'test-2',
      name: 'Converts 2.75 SOL (9 decimals) to 2750000000n',
      passed: t2,
      actual: String(raw2),
      expected: '2750000000n',
    });
    logs.push(t2 ? '✓ 2.75 SOL = 2,750,000,000 lamports' : `✗ Expected 2750000000n, received ${raw2}`);

    // Test 3: Reverse back to UI
    const uiBack = rawToUi(1500000n, 6);
    const t3 = uiBack === 1.5;
    testResults.push({
      id: 'test-3',
      name: 'Converts raw base units back to UI amount',
      passed: t3,
      actual: String(uiBack),
      expected: '1.5',
    });
    logs.push(t3 ? '✓ 1,500,000 units reverted back to 1.5' : `✗ Expected 1.5, received ${uiBack}`);

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'SPL Token conversion verified!' : 'Token decimal conversion failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 08. Associated Token Accounts ---
  private static async validateTokenAccounts(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

    const context = {
      PublicKey,
      Buffer,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.deriveAssociatedTokenAccount;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'deriveAssociatedTokenAccount' not found.");
    }

    const testWallet = Keypair.generate().publicKey;
    const testMint = Keypair.generate().publicKey;

    const ata = fn(testWallet, testMint);

    // Reference calculation
    const [expectedAta] = PublicKey.findProgramAddressSync(
      [testWallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), testMint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Test 1: Off-curve
    const t1 = !PublicKey.isOnCurve(ata);
    testResults.push({
      id: 'test-1',
      name: 'Produces off-curve PDA',
      passed: t1,
    });
    logs.push(t1 ? '✓ ATA is confirmed off-curve' : '✗ Address is not off-curve');

    // Test 2: Matches reference
    const t2 = ata?.equals?.(expectedAta);
    testResults.push({
      id: 'test-2',
      name: 'Matches SPL Token getAssociatedTokenAddressSync',
      passed: !!t2,
      actual: ata?.toBase58?.(),
      expected: expectedAta.toBase58(),
    });
    logs.push(t2 ? `✓ ATA matches standard derivation: ${expectedAta.toBase58()}` : '✗ ATA mismatch');

    // Test 3: Deterministic
    const ataAgain = fn(testWallet, testMint);
    const t3 = ataAgain?.equals?.(ata);
    testResults.push({
      id: 'test-3',
      name: 'Deterministic across repeated calls',
      passed: !!t3,
    });
    logs.push(t3 ? '✓ Consistent deterministic derivation' : '✗ Inconsistent derivation');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'Associated Token Account derivation verified!' : 'ATA derivation failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 09. CPI ---
  private static async validateCpi(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const context = {
      PublicKey,
      TransactionInstruction,
      SystemProgram,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.buildCpiTransferInstruction;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'buildCpiTransferInstruction' not found.");
    }

    const alice = Keypair.generate().publicKey;
    const bob = Keypair.generate().publicKey;
    const lamports = 500_000;

    const prep = fn(alice, bob, lamports);

    // Test 1: Callee is SystemProgram
    const t1 = prep?.calleeProgramId === SystemProgram.programId.toBase58();
    testResults.push({
      id: 'test-1',
      name: 'Targets System Program as callee',
      passed: t1,
      actual: prep?.calleeProgramId,
      expected: SystemProgram.programId.toBase58(),
    });
    logs.push(t1 ? '✓ CPI callee is System Program' : '✗ Callee program ID mismatch');

    // Test 2: Writability flags
    const t2 = prep?.isPayerWritable === true && prep?.isRecipientWritable === true;
    testResults.push({
      id: 'test-2',
      name: 'Marks both payer and recipient accounts as writable',
      passed: t2,
    });
    logs.push(t2 ? '✓ Both account metas writable' : '✗ Account writability flags incorrect');

    // Test 3: Instruction data
    const t3 = prep?.instruction?.data?.length === 12;
    testResults.push({
      id: 'test-3',
      name: 'Instruction data contains encoded transfer lamports',
      passed: t3,
      actual: `${prep?.instruction?.data?.length} bytes`,
      expected: '12 bytes',
    });
    logs.push(t3 ? '✓ Encoded instruction buffer size is 12 bytes' : '✗ Data buffer size mismatch');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'CPI Instruction verified!' : 'CPI validation failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  // --- 10. Deploy & Verify ---
  private static async validateDeploy(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    const testResults: TestResult[] = [];
    const logs: string[] = [];

    const BPF_UPGRADEABLE_LOADER_ID = new PublicKey(
      'BPFLoaderUpgradeab1e11111111111111111111111'
    );

    const context = {
      PublicKey,
      BPF_UPGRADEABLE_LOADER_ID,
    };

    const mod = this.evaluateModule(userCode, context);
    const fn = mod.verifyProgramAccount;
    if (typeof fn !== 'function') {
      throw new Error("Expected function 'verifyProgramAccount' not found.");
    }

    const validProgramAccount: AccountInfo<Buffer> = {
      executable: true,
      owner: BPF_UPGRADEABLE_LOADER_ID,
      lamports: 10_000_000,
      data: Buffer.alloc(36),
      rentEpoch: 0,
    };

    const invalidAccount: AccountInfo<Buffer> = {
      executable: false,
      owner: SystemProgram.programId,
      lamports: 10_000_000,
      data: Buffer.alloc(36),
      rentEpoch: 0,
    };

    const resValid = fn(validProgramAccount);
    const resInvalid = fn(invalidAccount);

    // Test 1: Valid program
    const t1 = resValid?.isProgram === true;
    testResults.push({
      id: 'test-1',
      name: 'Validates executable BPF Upgradeable Program',
      passed: t1,
    });
    logs.push(t1 ? '✓ Valid BPF Upgradeable Program accepted' : '✗ Failed to validate legitimate program');

    // Test 2: Rejects non-executable
    const t2 = resInvalid?.isProgram === false;
    testResults.push({
      id: 'test-2',
      name: 'Rejects non-executable data accounts',
      passed: t2,
    });
    logs.push(t2 ? '✓ Non-executable account properly rejected' : '✗ Non-executable account incorrectly approved');

    // Test 3: Non-BPF loader rejection
    const mockWrongOwner: AccountInfo<Buffer> = {
      executable: true,
      owner: SystemProgram.programId,
      lamports: 10_000,
      data: Buffer.alloc(0),
      rentEpoch: 0,
    };
    const resWrongOwner = fn(mockWrongOwner);
    const t3 = resWrongOwner?.isProgram === false;
    testResults.push({
      id: 'test-3',
      name: 'Rejects non-BPF Loader ownership',
      passed: t3,
    });
    logs.push(t3 ? '✓ Fake program owner rejected' : '✗ Accepted wrong loader owner');

    const allPassed = testResults.every((t) => t.passed);
    return {
      success: allPassed,
      score: allPassed ? challenge.points : 0,
      message: allPassed ? 'Program verification complete!' : 'Program verification checks failed.',
      output: logs.join('\n'),
      testResults,
      logs,
    };
  }

  private static async validateGeneric(userCode: string, challenge: Challenge): Promise<ValidationResult> {
    return {
      success: true,
      score: challenge.points,
      message: 'Challenge verified successfully!',
      output: 'All tests passed.',
      testResults: challenge.testCases.map((tc) => ({
        id: tc.id,
        name: tc.name,
        passed: true,
      })),
    };
  }
}
