import { createHash } from "node:crypto";

/**
 * Creates a stable MD5 hash for a given string input.
 * @param input The plain text value to hash.
 * @returns The MD5 hash as a lowercase hexadecimal string.
 */
export function hashString(input: string): string {
  return createHash("md5").update(input).digest("hex");
}
