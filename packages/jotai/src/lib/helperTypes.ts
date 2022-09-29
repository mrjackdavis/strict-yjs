import { WritableAtom } from "jotai";
import { MixedYjsJotaiAtom, YjsJotaiAtom } from "./common";
import * as t from "io-ts";

export type WritableAtomFromYjsJotaiAtom<TModel> = TModel extends YjsJotaiAtom<
  any,
  infer Value,
  infer Update,
  infer Result
>
  ? WritableAtom<Value, Update, Result>
  : never;

export type WritableAtomFromYjsJotaiAtomCodec<TModel extends t.Type<any>> =
  t.TypeOf<TModel> extends YjsJotaiAtom<
    any,
    infer Value,
    infer Update,
    infer Result
  >
    ? WritableAtom<Value, Update, Result>
    : never;
