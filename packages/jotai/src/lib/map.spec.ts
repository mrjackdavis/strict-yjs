import * as YjsJotai from "../index";
import { assert, t } from "./utils";
import * as Y from "yjs";
import { Store } from "./Store";

describe("YjsJotai.map", () => {
  describe("using a simple codec", () => {
    const codec = YjsJotai.map(t.NonEmptyString, t.BooleanFromString);

    it("should return an map of decoded values", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("1", "false");
        yMap.set("2", "true");
        yMap.set("10", "false");

        const myAtom = t.decodeOrThrow(codec)(yMap);
        const res = store.get(myAtom);

        expect(res).toEqual({
          1: false,
          2: true,
          10: false,
        });
      });
    });

    it("should be able to set inside set patch function", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");

        const myAtom = t.decodeOrThrow(codec)(yMap);

        // fixMe: ensure's we're tracking updates
        store.sub(myAtom);

        store.set(myAtom, (_current, op) => {
          op.set("1" as t.NonEmptyString, false);
          op.set("2" as t.NonEmptyString, true);
        });

        const res = store.get(myAtom);

        expect(res).toEqual({
          1: false,
          2: true,
        });
      });
    });

    it("should be able to delete inside set patch function", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");
        yMap.set("1", "false");
        yMap.set("2", "true");
        yMap.set("10", "false");

        const myAtom = t.decodeOrThrow(codec)(yMap);

        // fixMe: ensure's we're tracking updates
        store.sub(myAtom);

        store.set(myAtom, (_current, op) => {
          op.delete("2" as t.NonEmptyString);
        });
        const res = store.get(myAtom);

        expect(res).toEqual({
          1: false,
          10: false,
        });
      });
    });
  });
  describe("using a joyjio codec", () => {
    const innerCodec = YjsJotai.type(
      t.type({
        a: t.string,
      })
    );
    const codec = YjsJotai.map(t.NonEmptyString, innerCodec);

    it("should return a map of decoded values", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");

        yMap.set("1", new Y.Map([["a", "1"]]));
        yMap.set("2", new Y.Map([["a", "2"]]));

        const myAtom = t.decodeOrThrow(codec)(yMap);
        const res = store.get(myAtom);

        assert.invariant(res !== undefined, "");

        expect(Object.keys(res)).toEqual(["1", "2"]);

        const flatRes = Object.entries(res).map(
          ([key, innerAtom]) => [key, store.get(innerAtom)] as const
        );
        expect(flatRes).toEqual([
          ["1", { a: "1" }],
          ["2", { a: "2" }],
        ]);
      });
    });
    it("should be able to push inside set patch function", () => {
      Store.closure((store) => {
        const yDoc = new Y.Doc();
        const yMap = yDoc.getMap("MyMap");

        const myAtom = t.decodeOrThrow(codec)(yMap);

        const decodeInner = t.decodeOrThrow(innerCodec);

        // fixMe: ensure's we're tracking updates
        store.sub(myAtom);

        store.set(myAtom, (_current, operations) => {
          operations.set(
            "1" as t.NonEmptyString,
            decodeInner(new Y.Map([["a", "1"]]))
          );
          operations.set(
            "2" as t.NonEmptyString,
            decodeInner(new Y.Map([["a", "2"]]))
          );
        });

        const res = store.get(myAtom);

        assert.invariant(res !== undefined, "");

        expect(Object.keys(res)).toEqual(["1", "2"]);

        const flatRes = Object.entries(res).map(
          ([key, innerAtom]) => [key, store.get(innerAtom)] as const
        );
        expect(flatRes).toEqual([
          ["1", { a: "1" }],
          ["2", { a: "2" }],
        ]);
      });
    });
  });
  describe("map.make", () => {
    it("should force strict types", () => {
      const complexCodec = YjsJotai.map(
        t.string,
        t.type({
          a: t.BooleanFromString,
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

        // fixMe: ensure's we're tracking updates
        store.sub(doc.things);

        store.set(doc.things, (current, ops) =>
          ops.push(
            complexCodec.make({
              one: {
                a: true,
              },
            })
          )
        );
        const things = store.get(doc.things);
        const flatThings = things?.map((thing) => store.get(thing));

        expect(flatThings).toEqual([{ one: { a: true } }]);
      });
    });
    it.todo("should have a default value factory");
  });
});
