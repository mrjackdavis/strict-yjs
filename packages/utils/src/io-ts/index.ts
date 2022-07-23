import * as t from "io-ts";
import { decodeOrError, CodecValidationError } from "./Decoding";

export * from "io-ts";
export * from "io-ts-types";
export * from "./Duration";
export * from "./Decoding";

export function nullable<C extends t.Mixed>(codec: C) {
  return t.union([codec, t.null, t.undefined]);
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

/**
 *
 * @param enumName string to represent the enum
 * @param theEnum the enum itself
 *
 */
export function fromEnum<TEnumType>(
  enumName: string,
  theEnum: Record<string, string | number>
) {
  const isEnumValue = (input: unknown): input is TEnumType =>
    Object.values<unknown>(theEnum).includes(input);

  return new t.Type<TEnumType>(
    enumName,
    isEnumValue,
    (input, context) =>
      isEnumValue(input) ? t.success(input) : t.failure(input, context),
    t.identity
  );
}

export const map = <TD extends t.Mixed, TC extends t.Mixed>(
  keyCodec: TD,
  propertyCodec: TC
) =>
  new t.Type<Map<t.TypeOf<TD>, t.TypeOf<TC>>, t.RecordC<TD, TC>, unknown>(
    "MapFromObject",
    /** a custom type guard */
    (u): u is Map<t.TypeOf<TD>, t.TypeOf<TC>> => {
      throw new Error();
    },

    /** succeeds if a value of type I can be decoded to a value of type A */
    (input, context) => {
      const objOrError = decodeOrError(t.record(keyCodec, propertyCodec))(
        input
      );

      if (objOrError instanceof CodecValidationError) {
        return t.failure(objOrError, context);
      }

      return t.success(
        new Map<t.TypeOf<TD>, t.TypeOf<TC>>(Object.entries(objOrError))
      );
    },

    /** converts a value of type A to a value of type O */
    (a) => {
      return Object.fromEntries(a.entries());
    }
  );

export const jsonObject = new t.Type<object, string>(
  "JsonObject",
  t.UnknownRecord.is,
  (u, c) => {
    if (t.string.is(u)) {
      try {
        // This can throw (e.g. for "").
        const parsed = JSON.parse(u);
        if (typeof parsed === "object") {
          return t.success(parsed);
        }
      } catch {}
    }
    return t.failure(u, c);
  },
  (u) => JSON.stringify(u)
);
