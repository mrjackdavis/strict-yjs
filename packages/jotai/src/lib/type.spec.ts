import * as YjsJotai from "./index";
import { assert, t } from "./utils";
import * as Y from "yjs";
import { Store } from "./Store";
import { BooleanFromString, DateFromISOString } from "io-ts-types";

describe("YjsJotai.type", () => {
  const codec = YjsJotai.type(
    t.type({
      a: t.string,
    })
  );

  describe("simple atom get", () => {
    it("should work with t.type codecs", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("a", "hello");

        const myAtom = t.decodeOrThrow(codec)(yMap);

        const res = store.get(myAtom);

        expect(res).toEqual({ a: "hello" });
      });
    });

    it("should work with t.union codecs", () => {
      const unionCodec = YjsJotai.type(
        t.union([
          t.type({
            variant: t.literal("a"),
            a: t.string,
          }),
          t.type({
            variant: t.literal("b"),
            b: t.number,
          }),
        ])
      );
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("variant", "b");
        yMap.set("b", 2);

        const myAtom = t.decodeOrThrow(unionCodec)(yMap);

        const res = store.get(myAtom);

        expect(res).toEqual({ variant: "b", b: 2 });
      });
    });
  });

  describe("simple atom set", () => {
    it("should update atoms in response to YJS changes", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("a", "hello");

        const myAtom = t.decodeOrThrow(codec)(yMap);

        const res = store.get(myAtom);

        expect(res).toEqual({ a: "hello" });

        yMap.set("a", "goodbye");

        const res2 = store.get(myAtom);

        expect(res2).toEqual({ a: "goodbye" });
      });
    });

    it("should set inner yMap", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("a", "hello");

        const myAtom = t.decodeOrThrow(codec)(yMap);

        store.set(myAtom, () => {
          return {
            a: "goodbye",
          };
        });

        expect(yMap.get("a")).toEqual("goodbye");
        expect(store.get(myAtom)).toEqual({ a: "goodbye" });
      });
    });

    it.todo("update should batches yjs updates in transactions");

    it("update should encode values when writing to yMap", () => {
      const complexCodec = YjsJotai.type(
        t.partial({
          a: DateFromISOString,
        })
      );
      Store.closure((store) => {
        const testDate = new Date();
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");

        const myAtom = t.decodeOrThrow(complexCodec)(yMap);

        store.set(myAtom, () => {
          return {
            a: testDate,
          };
        });

        expect(yMap.get("a")).toEqual(testDate.toISOString());
        expect(store.get(myAtom)).toEqual({ a: testDate });
      });
    });
  });

  describe("atoms inside atoms", () => {
    it("should be able to get from a preexisting map", () => {
      const nestedCodec = YjsJotai.type(
        t.type({
          b: t.string,
        })
      );
      const complexCodec = YjsJotai.type(
        t.type({
          a: t.string,
          nested: nestedCodec,
        })
      );

      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("a", "hello");
        const newNestedAtomYMap = new Y.Map([["b", "hello2"]]);
        yMap.set("nested", newNestedAtomYMap);

        const myAtom = t.decodeOrThrow(complexCodec)(yMap);

        const nestedAtomThroughStore = store.get(myAtom)?.nested;
        expect(nestedAtomThroughStore).toBeDefined();
        assert.invariant(nestedAtomThroughStore !== undefined, "");
      });
    });

    it("should be able to set", () => {
      const nestedCodec = YjsJotai.type(
        t.type({
          b: t.string,
        })
      );
      const complexCodec = YjsJotai.type(
        t.type({
          a: t.string,
          nested: t.maybeUndefined(nestedCodec),
        })
      );

      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("a", "hello");

        const myAtom = t.decodeOrThrow(complexCodec)(yMap);

        let nestedAtom: t.TypeOf<typeof nestedCodec> | undefined;
        const newNestedAtomYMap = new Y.Map([["b", "hello2"]]);

        store.set(myAtom, () => {
          nestedAtom = t.decodeOrThrow(nestedCodec)(newNestedAtomYMap);

          return {
            nested: nestedAtom,
          };
        });
        assert.invariant(nestedAtom !== undefined, "");

        // check yjs is as expected
        const nestedYMap = yMap.get("nested");
        expect(nestedYMap).toBe(newNestedAtomYMap);

        const nestedAtomThroughStore = store.get(myAtom)?.nested;
        expect(nestedAtomThroughStore).toBeDefined();
        assert.invariant(nestedAtomThroughStore !== undefined, "");

        store.set(nestedAtomThroughStore, () => ({
          b: "hello3",
        }));

        expect(store.get(nestedAtomThroughStore)).toEqual({ b: "hello3" });
      });
    });
  });

  describe("type.make", () => {
    it("should force strict types", () => {
      const complexCodec = YjsJotai.type(
        t.type({
          a: BooleanFromString,
        })
      );
      const docCodec = YjsJotai.doc({
        things: YjsJotai.array(complexCodec),
      });

      const yDoc = new Y.Doc();
      const docAtom = t.decodeOrThrow(docCodec)(yDoc);

      Store.closure((store) => {
        const doc = store.get(docAtom);
        assert.invariant(doc?.things, "");

        store.set(doc.things, (current, ops) =>
          ops.push(
            complexCodec.make({
              a: true,
            })
          )
        );
        const things = store.get(doc.things);
        const flatThings = things?.map((thing) => store.get(thing));

        expect(flatThings).toEqual([{ a: true }]);
      });
    });
    it.todo("should have a default value factory");
  });
});
