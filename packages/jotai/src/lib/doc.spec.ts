import * as YjsJotai from "./index";
import { assert, t } from "./utils";
import * as Y from "yjs";
import { Store } from "./Store";
import { DateFromISOString } from "io-ts-types";
import { atom } from "jotai";

describe("YjsJotai.doc", () => {
  // should be able to build codec for entire doc?
  it("gets it done", () => {
    const codec = YjsJotai.doc({
      foo: YjsJotai.array(DateFromISOString),
      bar: YjsJotai.type(
        t.type({
          a: t.string,
        })
      ),
    });

    const yDoc = new Y.Doc();
    const docAtom = t.decodeOrThrow(codec)(yDoc);
    const nowDate = new Date();

    Store.closure((store) => {
      const doc = store.get(docAtom);

      assert.invariant(doc?.foo !== undefined, "");

      store.sub(doc.foo);
      store.set(doc.foo, (_current, op) => op.push(nowDate));

      const foo = store.get(doc.foo);

      expect(foo).toEqual([nowDate]);
      expect(yDoc.getArray("foo").toArray()).toEqual([nowDate.toISOString()]);
    });
  });

  it("create a transaction", () => {
    const codec = YjsJotai.doc({
      foo: YjsJotai.array(DateFromISOString),
      bar: YjsJotai.type(
        t.type({
          a: t.maybeUndefined(t.string),
        })
      ),
    });

    const yDoc = new Y.Doc();
    const docAtom = t.decodeOrThrow(codec)(yDoc);

    const spy = jest.fn();
    yDoc.on("update", spy);

    Store.closure((store) => {
      const doc = store.get(docAtom);

      assert.invariant(doc?.foo !== undefined, "");

      store.sub(doc.bar);

      const myNewAtom = atom(null, (get, set, val: string) => {
        const barAtom = get(docAtom).bar;
        const nextVal = {
          a: val,
        };

        get(docAtom).transact(() => {
          set(barAtom, () => nextVal);
          set(barAtom, () => nextVal);
          set(barAtom, () => nextVal);
          set(barAtom, () => nextVal);
          set(barAtom, () => nextVal);
        });
      });

      store.set(myNewAtom, "hello");

      const bar = store.get(doc.bar);

      expect(spy).toBeCalledTimes(1);
      expect(bar?.a).toEqual("hello");
    });
  });
});
