import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";
export * from "io-ts";
export * from "io-ts-types";

export function decodeOrThrow<I, A>(codec: t.Decoder<I, A>) {
  return (value: I): A => {
    const result = codec.decode(value);

    if (isLeft(result)) {
      throw new CodecValidationError(codec, value, PathReporter.report(result));
    }

    return result.right;
  };
}

export class CodecValidationError extends Error {
  constructor(
    codec: { name: string },
    value: unknown,
    public readonly errors: ReadonlyArray<string>
  ) {
    super(
      `Value violates codec: ${codec.name}: ${JSON.stringify(
        value
      )}. \n${errors.join("\n")}`
    );
  }
}

export function maybeUndefined<C extends t.Mixed>(codec: C) {
  return new t.Type<
    t.TypeOf<C> | undefined,
    t.OutputOf<C> | undefined,
    t.InputOf<C> | undefined
  >(
    `MaybeUndefined<${codec.name}>`,
    (u): u is t.TypeOf<C> | undefined => u === undefined || codec.is(u),
    (u, c) => {
      if (u === undefined) {
        return t.success(undefined);
      }
      return codec.validate(u, c);
    },
    (u) => {
      if (u === undefined) {
        return undefined;
      }
      return codec.encode(u);
    }
  );
}
