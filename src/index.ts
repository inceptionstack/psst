// psst SDK — programmatic access to encrypted vaults

// Backend types — useful for SDK consumers who want to introspect the
// active backend or construct a Vault programmatically with AWS settings.
export type {
  SecretHistoryRecord,
  SecretMetaRecord,
  SecretRecord,
  VaultBackend,
} from "./vault/backend.js";
export type {
  AwsBackendConfig,
  BackendType,
  VaultConfig,
} from "./vault/config.js";
export {
  loadConfig as loadVaultConfig,
  saveConfig as saveVaultConfig,
} from "./vault/config.js";
export { decrypt, encrypt, keyToBuffer } from "./vault/crypto.js";
export type { KeychainResult } from "./vault/keychain.js";
export {
  generateKey,
  getKey,
  isKeychainAvailable,
  storeKey,
} from "./vault/keychain.js";
export type {
  Secret,
  SecretHistoryEntry,
  SecretMeta,
  VaultOptions,
} from "./vault/vault.js";
export { Vault } from "./vault/vault.js";
