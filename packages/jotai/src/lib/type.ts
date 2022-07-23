import { t } from "@strict-yjs/utils";
import { Either } from "fp-ts/lib/Either";
import { atom } from "jotai";
import * as Y from "yjs";
import {
  YjsJotaiAtom,
  YjsJotaiCodec,
  mutateAtomWithYjsJotaiMetadata,
  YMapDomain,
  yMapToShallowJson,
} from "./common";

type PatchFn<A> = (object: A) => Partial<A>;

export type TypeAtom<A> = YjsJotaiAtom<Y.Map<unknown>, A, PatchFn<A>, void>;
export type TypeC<A extends { [key: YMapDomain]: any }> = YjsJotaiCodec<
  YjsJotaiAtom<Y.Map<unknown>, A, PatchFn<A>, void>,
  Y.Map<unknown>,
  unknown,
  A
>;

export const type = <
  A extends { [key: YMapDomain]: any },
  O extends { [key: YMapDomain]: any } = A
>(
  innerCodec: t.Type<A, O>
): TypeC<A> => {
  /** a function which returns an object to merge into the original */
  type ThisPatchFn = PatchFn<A>;
  type AtomA = YjsJotaiAtom<Y.Map<unknown>, A, ThisPatchFn, void>;

  return new YjsJotaiCodec<AtomA, Y.Map<unknown>, unknown, A>(
    `YjsJotaiMapAtom<${innerCodec.name}>`,

    /** a custom type guard */
    (u: unknown): u is AtomA => {
      if (!(u instanceof atom)) {
        return false;
      }
      throw new Error("`is` is not implemented");
    },

    /** succeeds if a value of type I can be decoded to a value of type A */
    (input: unknown, context: t.Context): Either<t.Errors, AtomA> => {
      if (!(input instanceof Y.Map)) {
        return t.failure(input, context, "input must be Y.Map");
      }

      const jsonAtom = atom(yMapToShallowJson(input));

      jsonAtom.onMount = (set) => {
        const observeFn = () => {
          set(yMapToShallowJson(input));
        };
        input.observe(observeFn);

        return () => input.unobserve(observeFn);
      };

      const decodedAtom = atom(
        (get) => {
          const json = get(jsonAtom);
          return t.decodeOrThrow(innerCodec)(json);
        },
        (get, _set, patchFn: ThisPatchFn) => {
          const original = get(decodedAtom);

          const update = patchFn(original);

          const updateObjectKeys = Object.keys(update);
          if (updateObjectKeys.length < 1) {
            return;
          }

          const encoded = innerCodec.encode({
            ...original,
            ...update,
          });

          // todo transaction
          for (const entryKey of updateObjectKeys) {
            const newValue = encoded[entryKey];
            input.set(entryKey, newValue);
          }
        }
        // fix: as AtomA below
      ) as AtomA;

      mutateAtomWithYjsJotaiMetadata(decodedAtom, input);

      return t.success(decodedAtom);
    },
    Y.Map,
    (value): Y.Map<unknown> => {
      const encodedVal = innerCodec.encode(value);
      return new Y.Map(Object.entries(encodedVal));
    }
  );
};
