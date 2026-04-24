/**
 * Small helpers to narrow `unknown` errors. Used across the vault backends
 * (and elsewhere) instead of `catch (err: any)`.
 */

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * True when `err` is an AWS-SDK-style error with a `.name` discriminant
 * like "ResourceNotFoundException".
 */
export function isAwsErrorNamed(err: unknown, name: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: unknown }).name === name
  );
}

/**
 * True when `err` is any AWS-SDK-style error (has a string `.name`).
 * Useful when you want to read the discriminant yourself via errorName().
 */
export function isAwsError(
  err: unknown,
): err is { name: string; message?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    typeof (err as { name: unknown }).name === "string"
  );
}
