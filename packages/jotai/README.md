# Strict YJS - Jotai

Strongly typed YJS using runtime codecs with io-ts. And Jotai for read-write and change tracking.

Rough idea

```ts
import * as YjsJotai from "@strict-yjs/jotai";
import { assert, t } from "./utils";
import * as Y from "yjs";
import { Store } from "./Store";

const codec = YjsJotai.doc({
  foo: YjsJotai.array(t.DateFromISOString),
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
```
