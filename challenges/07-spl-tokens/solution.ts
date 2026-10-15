export function uiAmountToRawUnits(amountUi: number, decimals: number): bigint {
  const factor = 10 ** decimals;
  return BigInt(Math.round(amountUi * factor));
}

export function rawUnitsToUi(rawUnits: bigint, decimals: number): number {
  const factor = 10 ** decimals;
  return Number(rawUnits) / factor;
}
