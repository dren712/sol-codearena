# Challenge 04: Program Derived Addresses (PDAs) [Flagship Demo Day]

## Concept
Program Derived Addresses (PDAs) allow Solana programs to control accounts deterministically without holding private keys.

A PDA is derived by taking:
- Seeds (arbitrary byte slices, such as `Buffer.from("user")` and `wallet.toBuffer()`)
- Program ID (the program that owns the PDA)
- Bump seed (a 1-byte value between 255 and 0 that forces the address off the Ed25519 elliptic curve)

Because off-curve points cannot have a corresponding private key on the Ed25519 curve, no human or external attacker can sign for a PDA. Only the program itself can sign via `invoke_signed`.

## Formula
```typescript
const seeds = [Buffer.from("user"), wallet.toBuffer()];
const [pda, bump] = PublicKey.findProgramAddressSync(seeds, programId);
```
