import { WritableAtom, Atom, unstable_createStore } from "jotai";

export class Store {
  private readonly internalJotaiStore = unstable_createStore();

  private readonly mountedAtomUnsubscribeFns = new Set<() => void>();

  private mount<Value, Update = unknown>(
    atom: Atom<Value> | WritableAtom<Value, Update>,
    onUpdate: () => void = makeNoop()
  ) {
    const unsub = this.internalJotaiStore.sub(atom, onUpdate);
    this.mountedAtomUnsubscribeFns.add(unsub);
  }

  public sub = this.mount;

  public dispose() {
    for (const unsubFn of this.mountedAtomUnsubscribeFns) {
      unsubFn();
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

  public set = this.internalJotaiStore.set;

  public static closure<TFnRes>(fn: (store: Store) => TFnRes) {
    const thisStore = new Store();
    const res = fn(thisStore);
    if (res instanceof Promise) {
      res;
    }
    thisStore.mountedAtomUnsubscribeFns;
    thisStore.dispose();

    return res;
  }
}

const makeNoop = () => () => {
  return;
};
