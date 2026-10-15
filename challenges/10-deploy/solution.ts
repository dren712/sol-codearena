import { AccountInfo, PublicKey } from '@solana/web3.js';

export const BPF_UPGRADEABLE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
);

export function verifyProgramAccount(accountInfo: AccountInfo<Buffer> | null) {
  if (!accountInfo) {
    return {
      isProgram: false,
      isExecutable: false,
      isUpgradeableLoader: false,
      reason: 'Missing account',
    };
  }

  const isProgram = accountInfo.executable && accountInfo.owner.equals(BPF_UPGRADEABLE_LOADER_ID);

  return {
    isProgram,
    isExecutable: accountInfo.executable,
    isUpgradeableLoader: accountInfo.owner.equals(BPF_UPGRADEABLE_LOADER_ID),
  };
}
