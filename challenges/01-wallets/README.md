# Challenge 01: Wallets & Keypairs

## Concept
On Solana, accounts are identified by their 32-byte Ed25519 public key. A keypair consists of a 64-byte secret key (32 bytes private seed + 32 bytes public key).
Cryptographic signatures allow wallets to sign transactions and arbitrary messages without exposing their private key.

## Task
Implement `generateAndSignMessage(message: string)`:
1. Generate a fresh keypair using `Keypair.generate()`.
2. Convert `message` to UTF-8 bytes using `TextEncoder`.
3. Sign using `nacl.sign.detached(messageBytes, keypair.secretKey)`.
4. Verify using `nacl.sign.detached.verify(messageBytes, signature, keypair.publicKey.toBytes())`.
5. Return `{ publicKey, signature, verified }`.
