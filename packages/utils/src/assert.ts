/**
 * Assertion to prove switch-case has been exhausted
 */
export const exhausted = (neverValue: never): never => {
  throw new Error(
    `Switch case should have been exhaustive. Instead received ${neverValue}`
  );
};

/**
 * enforced non-nullability on parameter
 */
export const required = <TObj>(obj: TObj | undefined | null): TObj => {
  if (obj === null || obj === undefined) {
    throw new Error("Expected object to be defined");
  }
  return obj;
};

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
