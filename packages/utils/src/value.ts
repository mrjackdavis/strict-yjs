export function lazy<T>(makeValue: () => T): LazyValue<T> {
  const res: LazyValue<T> = (): T => {
    if (res.isEvaluated) {
      return res.value as any;
    }

    res.value = makeValue();
    res.isEvaluated = true;

    return res.value;
  };

  res.isEvaluated = false;

  return res;
}

/**
 * @deprecated
 */
export const value = lazy;

export interface LazyValue<T> {
  (): T;

  /**
   * Is the result cached already
   */
  isEvaluated: boolean;
  value?: T;
}
