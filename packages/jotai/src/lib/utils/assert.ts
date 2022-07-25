/**
 * Runtime type assertion
 */
export function invariant(
  expression: unknown,
  errorMessage: string
): asserts expression {
  if (!expression) {
    throw new Error(`Invariant failed: ${errorMessage}`);
  }
}
