/**
 * Generate a cryptographically random UUID v4 for use as a supplier public form token.
 */
export function generatePublicFormToken(): string {
  return crypto.randomUUID();
}
