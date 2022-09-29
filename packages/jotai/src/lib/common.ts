import { Atom, WritableAtom } from "jotai";
import * as Y from "yjs";
import { assert, t } from "./utils";
export type YMapDomain = string;

export function yMapToShallowJson<T>(yMap: Y.Map<T>): Record<YMapDomain, T> {
  return Object.fromEntries(yMap.entries());
}

export type ValidYTypesForYjsJotai = Y.Map<unknown> | Y.Array<unknown>;

export type YjsJotaiAtomIdentification<YType extends ValidYTypesForYjsJotai> = {
  wrappedYObject: YType;
};

export interface YjsJotaiAtom<
  YType extends ValidYTypesForYjsJotai,
  Value,
  Update,
  Result extends void | Promise<void> = void
> extends WritableAtom<Value, Update, Result>,
    YjsJotaiAtomIdentification<YType> {}

export type MixedYjsJotaiAtom = YjsJotaiAtom<
  ValidYTypesForYjsJotai,
  any,
  any,
  void | Promise<void>
>;

export function mutateAtomWithYjsJotaiMetadata<
  TAtom extends Atom<any>,
  YType extends ValidYTypesForYjsJotai
>(
  thisAtom: TAtom,
  yObject: YType
): asserts thisAtom is TAtom & YjsJotaiAtomIdentification<YType> {
  (thisAtom as TAtom & YjsJotaiAtomIdentification<YType>).wrappedYObject =
    yObject;
}

export class YjsJotaiCodec<
  A extends YjsJotaiAtom<O, any, any, void | Promise<void>>,
  O extends ValidYTypesForYjsJotai,
  I = unknown,
  MakeValue = unknown
> extends t.Type<A, O, I> {
  constructor(
    /** a unique name for this codec */
    name: string,
    /** a custom type guard */
    is: t.Is<A>,
    /** succeeds if a value of type I can be decoded to a value of type A */
    validate: t.Validate<I, A>,

    public readonly yType: new () => Y.AbstractType<any>,

    make?: (value: MakeValue) => O & I
  ) {
    super(name, is, validate, yjsJotaiAtomToYObject);
    this.innerMake = make;
  }

  private readonly innerMake;
  public make(value: MakeValue) {
    assert.invariant(this.innerMake, "codec does not support make");
    const yObj = this.innerMake(value);
    return t.decodeOrThrow(this)(yObj);
  }
}

export const yjsJotaiAtomToYObject = <YType extends ValidYTypesForYjsJotai>(
  a: YjsJotaiAtomIdentification<YType>
) => a.wrappedYObject;
