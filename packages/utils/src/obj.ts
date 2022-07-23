import * as lodash from "lodash";
import * as lodashFp from "lodash/fp";

export const omitNullish = lodashFp.pickBy(lodash.identity);

/**
 * asserts that obj is of type T. But returns typeof obj
 */
export const narrow =
  <T>() =>
  <TNarrow extends T>(obj: TNarrow) =>
    obj;
