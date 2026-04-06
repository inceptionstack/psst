// psst SDK — programmatic access to encrypted vaults

export { Vault } from "./vault/vault.js";
export type { VaultOptions, Secret, SecretMeta, SecretHistoryEntry } from "./vault/vault.js";
export { encrypt, decrypt, keyToBuffer } from "./vault/crypto.js";
export {
  getKey,
  storeKey,
  generateKey,
  isKeychainAvailable,
} from "./vault/keychain.js";
export type { KeychainResult } from "./vault/keychain.js";
