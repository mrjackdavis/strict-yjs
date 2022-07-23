import { UUID } from "io-ts-types";
import { v4 as uuidV4 } from "uuid";

export const v4 = () => uuidV4() as UUID;

export class DeterministicUUIDFactory {
  private readonly prefix = "00000000-0000-0000-0000-";
  private nextNum = 0;

  public next() {
    const result = this.prefix + this.nextNum.toString().padStart(12, "0");
    this.nextNum++;
    return result;
  }
}
