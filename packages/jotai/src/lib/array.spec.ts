import * as Y from "yjs";
import * as YjsJotai from "../index";
import { Store } from "./Store";
import { assert, t } from "./utils";
import { BooleanFromString } from "io-ts-types";

describe("YjsJotai.array", () => {
  describe("using a simple codec", () => {
    const codec = YjsJotai.array(BooleanFromString);

    it("should return an array of decoded values", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yArray = yDoc.getArray("MyArray");
        yArray.push(["true", "false"]);

        const myAtom = t.decodeOrThrow(codec)(yArray);
        const res = store.get(myAtom);

        expect(res).toEqual([true, false]);
      });
    });

    it("should be able to push inside set patch function", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yArray = yDoc.getArray("MyArray");

        const myAtom = t.decodeOrThrow(codec)(yArray);

        store.set(myAtom, (_current, op) => {
          op.push([true, false]);
          op.push(true);
        });

        const res = store.get(myAtom);

        expect(res).toEqual([true, false, true]);
        expect(yArray.toArray()).toEqual(["true", "false", "true"]);
      });
    });

    it("should be able to delete inside set patch function", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yArray = yDoc.getArray("MyArray");
        yArray.push(["true", "false", "true", "false", "false"]);

        const myAtom = t.decodeOrThrow(codec)(yArray);

        store.set(myAtom, (_current, op) => {
          op.delete(3, 2);
          op.delete(1);
        });

        const res = store.get(myAtom);

        expect(res).toEqual([true, true]);
        expect(yArray.toArray()).toEqual(["true", "true"]);
      });
    });
  });
  describe("using a YjsJotai codec", () => {
    const innerCodec = YjsJotai.type(
      t.type({
        a: t.string,
      })
    );
    const codec = YjsJotai.array(innerCodec);

    it("should return an array of decoded values", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yArray = yDoc.getArray("MyArray");
        yArray.push([new Y.Map([["a", "1"]]), new Y.Map([["a", "2"]])]);

        const myAtom = t.decodeOrThrow(codec)(yArray);
        const res = store.get(myAtom);

        assert.invariant(res !== undefined, "");
        const flatRes = res.map((innerAtom) => store.get(innerAtom));

        expect(flatRes).toEqual([
          {
            a: "1",
          },
          { a: "2" },
        ]);
      });
    });
    it("should be able to push inside set patch function", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yArray = yDoc.getArray("MyArray");

        const myAtom = t.decodeOrThrow(codec)(yArray);
        const decodeInnerCodec = t.decodeOrThrow(innerCodec);

        store.set(myAtom, (_current, op) => {
          op.push([
            decodeInnerCodec(new Y.Map([["a", "1"]])),
            decodeInnerCodec(new Y.Map([["a", "2"]])),
          ]);
        });

        const res = store.get(myAtom);

        assert.invariant(res !== undefined, "");
        const flatRes = res.map((innerAtom) => store.get(innerAtom));

        expect(flatRes).toEqual([
          {
            a: "1",
          },
          { a: "2" },
        ]);
      });
    });
  });
  describe("array.make", () => {
    it("should force strict types", () => {
      const boolArr = YjsJotai.array(BooleanFromString);
      const bar = YjsJotai.type(
        t.type({
          baz: t.maybeUndefined(boolArr),
          baz2: t.maybeUndefined(boolArr),
        })
      );
      const docCodec = YjsJotai.doc({
        foo: bar,
      });

      const yDoc = new Y.Doc();
      const docAtom = t.decodeOrThrow(docCodec)(yDoc);

      Store.closure((store) => {
        const doc = store.get(docAtom);
        assert.invariant(doc?.foo, "");

        const arrayItemAtom = boolArr.make([true, false, true, false]);

        store.set(doc.foo, () => ({
          baz: arrayItemAtom,
          // also ensure empty works too
          baz2: boolArr.make(),
        }));

        const foo = store.get(doc.foo);
        assert.invariant(foo?.baz, "");
        const baz = store.get(foo.baz);
        assert.invariant(baz, "");

        expect(baz).toEqual([true, false, true, false]);
      });
    });
    it.todo("should have a default value factory");
  });
});
