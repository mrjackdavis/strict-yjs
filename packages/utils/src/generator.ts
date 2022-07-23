export function* filter<T, S extends T>(
  generator: Generator<T, void, unknown>,
  filterPredicate: (value: T, index: number) => value is S
) {
  let i = 0;
  for (const iterator of generator) {
    if (filterPredicate(iterator, i)) {
      yield iterator;
    }

    i++;
  }
}

// filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S[];
