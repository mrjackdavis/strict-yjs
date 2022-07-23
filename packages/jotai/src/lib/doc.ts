import { t } from "@strict-yjs/utils";
import { Either } from "fp-ts/lib/Either";
import { atom, Atom } from "jotai";
import * as Y from "yjs";
import {
  YjsJotaiAtom,
  YjsJotaiCodec,
  MixedYjsJotaiAtom,
  ValidYTypesForYjsJotai,
} from "./common";

type YjsJotaiMixedCodec<YType extends ValidYTypesForYjsJotai> = YjsJotaiCodec<
  YjsJotaiAtom<YType, any, any, void | Promise<void>>,
  YType,
  unknown,
  any
>;

type DocTypesDefinition = {
  [key: string]: YjsJotaiMixedCodec<any>;
};
export type DocC<TDocTypesDefinition extends DocTypesDefinition> = t.Decoder<
  Y.Doc,
  Atom<{
    [key in keyof TDocTypesDefinition]: t.TypeOf<TDocTypesDefinition[key]>;
  }>
>;

export const doc = <TDocTypesDefinition extends DocTypesDefinition>(
  docTypesDefinition: TDocTypesDefinition
): DocC<TDocTypesDefinition> => {
  type TypeOfDocTypesDefinition = {
    [key in keyof TDocTypesDefinition]: t.TypeOf<TDocTypesDefinition[key]>;
  };
  return new t.Type<Atom<TypeOfDocTypesDefinition>, Y.Doc, Y.Doc>(
    `YjsJotaiDocAtom`,

    /** a custom type guard */
    (u: unknown): u is Atom<TypeOfDocTypesDefinition> => {
      throw new Error("`is` is not implemented");
    },

    /** succeeds if a value of type I can be decoded to a value of type A */
    (input, context): Either<t.Errors, Atom<TypeOfDocTypesDefinition>> => {
      try {
        const data: TypeOfDocTypesDefinition =
          decodeAllDocDefinitions<TDocTypesDefinition>(
            input,
            docTypesDefinition
          );

        const decodedAtom: Atom<TypeOfDocTypesDefinition> = atom(() => data);

        return t.success(decodedAtom);
      } catch (err) {
        return t.failure(
          undefined,
          context,
          err instanceof Error ? err.message : undefined
        );
      }
    },

    /** converts a value of type A to a value of type O */
    (a) => {
      throw new Error("`encode` is not implemented");
    }
  ).asDecoder();
};

function decodeDocAtom<
  TCodec extends YjsJotaiMixedCodec<ValidYTypesForYjsJotai>
>(doc: Y.Doc, key: string, codec: TCodec) {
  const yObjectFromDoc = doc.get(key, codec.yType);

  return t.decodeOrThrow(codec)(yObjectFromDoc);
}

function decodeAllDocDefinitions<
  TDocTypesDefinition extends DocTypesDefinition
>(
  doc: Y.Doc,
  definitions: TDocTypesDefinition
): {
  [key in keyof TDocTypesDefinition]: t.TypeOf<TDocTypesDefinition[key]>;
} {
  const decodedEntries = Object.entries(definitions).map(
    ([key, val]) => [key, decodeDocAtom(doc, key, val)] as const
  );
  // fixme
  return Object.fromEntries(decodedEntries) as any;
}
