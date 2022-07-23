import { invariant } from "./assert";

export function nonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function oneOrThrow<TArr extends Array<unknown>>(value: TArr): TArr[0] {
  const res = value[0];
  invariant(
    res !== undefined && value.length === 1,
    "Array didn't have exactly one entry as expected"
  );
  return res;
}
