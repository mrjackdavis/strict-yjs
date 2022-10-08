import { t } from "./utils";
import { Either } from "fp-ts/lib/Either";
import { atom } from "jotai";
import * as Y from "yjs";
import {
  YjsJotaiAtom,
  YjsJotaiCodec,
  mutateAtomWithYjsJotaiMetadata,
  yMapToShallowJson,
} from "./common";

export type MapC<
  // keys can only be strings
  KeyCodec extends ExtendableKeyCodec,
  A
> = YjsJotaiCodec<
  YjsJotaiAtom<
    Y.Map<unknown>,
    t.TypeOf<t.RecordC<KeyCodec, t.Type<A>>>,
    PatchFn<t.TypeOf<KeyCodec>, A>,
    void
  >,
  Y.Map<unknown>,
  unknown,
  t.TypeOf<t.RecordC<KeyCodec, t.Type<A>>>
>;

type ExtendableKeyCodec = t.Type<any, string>;
type PatchFnOperations<KeyType, ValueType> = {
  set: (key: KeyType, item: ValueType) => void;
  delete: (key: KeyType) => void;
};
/** a function which returns an object to merge into the original */
type PatchFn<KeyType extends string, ValueType> = ((
    current: { [K in KeyType]: ValueType },
    operations: PatchFnOperations<KeyType, ValueType>
  ) => void | undefined)
  | (() => {[K in KeyType]: ValueType});

export const map = <
  // keys can only be strings
  KeyCodec extends ExtendableKeyCodec,
  A,
  O = A
>(
  keyCodec: KeyCodec,
  valueCodec: t.Type<A, O, unknown>
): MapC<KeyCodec, A> => {
  type InnerC = t.Type<A, O, unknown>;
  type RecordType = t.TypeOf<t.RecordC<KeyCodec, InnerC>>;
  type KeyType = t.TypeOf<KeyCodec>;
  type ThisPatchFnOperations = PatchFnOperations<KeyType, A>;
  /** a function which returns an object to merge into the original */
  type ThisPatchFn = PatchFn<KeyType, A>;

  type ThisYjsJotaiMapAtom = YjsJotaiAtom<
    Y.Map<unknown>,
    RecordType,
    ThisPatchFn,
    void
  >;

  return new YjsJotaiCodec<
    ThisYjsJotaiMapAtom,
    Y.Map<unknown>,
    unknown,
    RecordType
  >(
    `YjsJotaiMapAtom<${keyCodec.name},${valueCodec.name}>`,

    /** a custom type guard */
    (u: unknown): u is ThisYjsJotaiMapAtom => {
      if (!(u instanceof atom)) {
        return false;
      }
      throw new Error("`is` is not implemented");
    },

    /** succeeds if a value of type I can be decoded to a value of type A */
    (
      input: unknown,
      context: t.Context
    ): Either<t.Errors, ThisYjsJotaiMapAtom> => {
      if (!(input instanceof Y.Map)) {
        return t.failure(input, context, "input must be Y.Map");
      }

      const baseAtom = atom(yMapToShallowJson(input));

      baseAtom.onMount = (set) => {
        const observeFn = () => {
          set(yMapToShallowJson(input));
        };
        input.observe(observeFn);

        return () => input.unobserve(observeFn);
      };

      const decodedAtom = atom(
        (get) => {
          const data = get(baseAtom);
          return t.decodeOrThrow(t.record(keyCodec, valueCodec))(data);
        },
        (get, _set, patchFn: ThisPatchFn) => {
          const original = get(decodedAtom);

          const operations: ThisPatchFnOperations = {
            set: (key, val) => {
              input.set(keyCodec.encode(key), valueCodec.encode(val));
            },
            delete: (key) => input.delete(key),
          };

          const patch = patchFn(original, operations);
          if (patch === undefined) {
            return
          }

          for (const [key, val] of Object.entries<A>(patch)) {
            input.set(keyCodec.encode(key), valueCodec.encode(val));
          }
        }
        // fix: as AtomA below
      ) as ThisYjsJotaiMapAtom;

      mutateAtomWithYjsJotaiMetadata(decodedAtom, input);

      return t.success(decodedAtom);
    },
    Y.Map,
    (value: RecordType): Y.Map<unknown> => {
      const entries = Object.entries<RecordType[keyof RecordType]>(value);
      return new Y.Map(
        entries.map(([entryKey, entryValue]) => [
          keyCodec.encode(entryKey),
          valueCodec.encode(entryValue),
        ])
      );
    }
  );
};
