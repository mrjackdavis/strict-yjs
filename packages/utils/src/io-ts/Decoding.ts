import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";

export function decodeOrUndefined<I, A>(codec: t.Decoder<I, A>) {
  return (value: I) => {
    const result = codec.decode(value);

    if (isLeft(result)) {
      return undefined;
    }

    return result.right;
  };
}

export function decodeOrThrow<I, A>(codec: t.Decoder<I, A>) {
  return (value: I): A => {
    const result = codec.decode(value);

    if (isLeft(result)) {
      throw new CodecValidationError(codec, value, PathReporter.report(result));
    }

    return result.right;
  };
}
/**
 * returns the decoded value or an error
 */

export function decodeOrError<I, A>(codec: t.Decoder<I, A>) {
  return (value: I) => {
    const result = codec.decode(value);

    if (isLeft(result)) {
      return new CodecValidationError(
        codec,
        value,
        PathReporter.report(result)
      );
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
