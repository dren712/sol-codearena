import { AccountInfo, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';

export interface AccountReport {
  solBalance: number;
  isExecutable: boolean;
  isSystemOwned: boolean;
  dataLength: number;
  ownerAddress: string;
}

export function inspectAccount(accountInfo: AccountInfo<Buffer> | null): AccountReport | null {
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
}
