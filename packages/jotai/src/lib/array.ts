import { t } from "./utils";
import { Either } from "fp-ts/lib/Either";
import { atom } from "jotai";
import * as Y from "yjs";
import {
  YjsJotaiAtom,
  YjsJotaiCodec,
  mutateAtomWithYjsJotaiMetadata,
} from "./common";

export type ArrayC = typeof array;
export const array = <A, O = A>(innerCodec: t.Type<A, O, unknown>) => {
  type InnerC = t.Type<A, O, unknown>;
  type PatchFnOperations = {
    push: (item: A | A[]) => void;
    delete: (index: number, length?: number) => void;
  };
  /** a function which returns an object to merge into the original */
  type PatchFn = (
    current: t.TypeOf<InnerC>[],
    operations: PatchFnOperations
  ) => void;

  type ThisYjsJotaiArrayAtom = YjsJotaiAtom<
    Y.Array<unknown>,
    A[],
    PatchFn,
    void
  >;

  return new YjsJotaiCodec<
    YjsJotaiAtom<Y.Array<unknown>, A[], PatchFn, void>,
    Y.Array<unknown>,
    unknown,
    A[]
  >(
    `YjsJotaiArrayAtom<${innerCodec.name}>`,

    /** a custom type guard */
    (u: unknown): u is ThisYjsJotaiArrayAtom => {
      if (!(u instanceof atom)) {
        return false;
      }
      throw new Error("`is` is not implemented");
    },

    /** succeeds if a value of type I can be decoded to a value of type A */
    (
      input: unknown,
      context: t.Context
    ): Either<t.Errors, ThisYjsJotaiArrayAtom> => {
      if (!(input instanceof Y.Array)) {
        return t.failure(input, context, "input must be Y.Array");
      }

      const baseAtom = atom(input.toArray());

      baseAtom.onMount = (set) => {
        const observeFn = () => {
          set(input.toArray());
        };
        input.observe(observeFn);

        return () => input.unobserve(observeFn);
      };

      const decodedAtom = atom(
        (get) => {
          const data = get(baseAtom);
          return t.decodeOrThrow(t.array(innerCodec))(data);
        },
        (get, _set, patchFn: PatchFn) => {
          const original = get(decodedAtom);

          const operations: PatchFnOperations = {
            push: (item: A | A[]) =>
              input.push(
                (item instanceof Array ? item : [item]).map((item) =>
                  innerCodec.encode(item)
                )
              ),
            delete: (...args) => input.delete(...args),
          };

          patchFn(original, operations);
        }
        // fix: as AtomA below
      );

      mutateAtomWithYjsJotaiMetadata(decodedAtom, input);

      return t.success(decodedAtom);
    },
    Y.Array,
    (entries = []): Y.Array<unknown> => {
      const encodedArray = entries.map(
        (entry) => innerCodec.encode(entry) as unknown
      );

      return Y.Array.from(encodedArray);
    }
  );
};
