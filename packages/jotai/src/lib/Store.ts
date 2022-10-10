import { WritableAtom, Atom, unstable_createStore } from "jotai";

export class Store {
  private readonly internalJotaiStore = unstable_createStore();

  private readonly mountedAtoms = new Map<
    Atom<unknown>,
    { unsubscribe: () => void }
  >();

  private mount<Value, Update = unknown>(
    atom: Atom<Value> | WritableAtom<Value, Update>,
    onUpdate: () => void = makeNoop()
  ) {
    if (this.mountedAtoms.has(atom)) {
      return;
    }

    const unsubscribe = this.internalJotaiStore.sub(atom, onUpdate);
    this.mountedAtoms.set(atom, {
      unsubscribe,
    });
  }

  public sub = this.mount;

  public dispose() {
    for (const [_atom, val] of this.mountedAtoms) {
      val.unsubscribe();
    }
  }

  public get<A>(
    atom: Atom<A> | WritableAtom<A, unknown>,
    onUpdate?: () => void
  ) {
    this.mount(atom, onUpdate);
    return this.internalJotaiStore.get(atom);
  }

  public asyncGet<A>(
    atom: Atom<A> | WritableAtom<A, unknown>,
    onUpdate?: () => void
  ) {
    this.mount(atom, onUpdate);
    return this.internalJotaiStore.asyncGet(atom);
  }

  public set<Value_2, Update, Result extends void | Promise<void>>(
    atom: WritableAtom<Value_2, Update, Result>,
    update: Update
  ): Result {
    this.mount(atom);
    return this.internalJotaiStore.set(atom, update);
  }

  public static closure<TFnRes>(fn: (store: Store) => TFnRes) {
    const thisStore = new Store();
    const res = fn(thisStore);
    if (res instanceof Promise) {
      res;
    }
    thisStore.mountedAtoms;
    thisStore.dispose();

    return res;
  }
}

const makeNoop = () => () => {
  return;
};
