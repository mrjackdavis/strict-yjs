import * as t from "io-ts";
import { NumberFromString } from "io-ts-types";
import { decodeOrThrow } from "./Decoding";
import { getDurationFromSeconds, durationToSeconds } from "../dateFns";

// represents a Duration
export const Duration = t.partial(
  {
    years: t.number,
    months: t.number,
    weeks: t.number,
    days: t.number,
    hours: t.number,
    minutes: t.number,
    seconds: t.number,
  },
  "Duration"
);

// represents a Duration from a string
export const DurationFromString = new t.Type<Duration, string, unknown>(
  "DurationFromString",
  Duration.is,
  (u, c) => {
    try {
      const str = decodeOrThrow(t.string)(u);
      const matches = [...str.matchAll(/((\d+)([smdh]))/g)];
      // ["12m", "12m", "12", "m"]
      const durationEntries = matches.map((match) => {
        const number = decodeOrThrow(NumberFromString)(match[2]);
        const unit = match[3];
        const durationKey = durationKeyForDurationShortString(unit);

        return [durationKey, number];
      });

      const res = Object.fromEntries(durationEntries) as Duration;

      return t.success(res);
    } catch (e) {
      return t.failure(e, c);
    }
  },
  (a) => {
    try {
      const encodeRes = Object.entries(a)
        .map(
          ([key, val]) => `${val.toString()}${shortStringForDurationKey(key)}`
        )
        .join(" ");
      return encodeRes;
    } catch (e) {
      return "";
    }
  }
);

const shortDurationStringMap = {
  years: "y",
  months: "mo",
  weeks: "w",
  days: "d",
  hours: "h",
  minutes: "m",
  seconds: "s",
} as const;

function stringIsLongDurationString(
  key: string
): key is keyof typeof shortDurationStringMap {
  return key in shortDurationStringMap;
}

function shortStringForDurationKey(key: string) {
  if (!stringIsLongDurationString(key)) {
    throw new Error(`"${key}" not found in duration key map`);
  }

  return shortDurationStringMap[key];
}

function durationKeyForDurationShortString(
  shortKey: string
): keyof typeof shortDurationStringMap {
  const res = Object.entries(shortDurationStringMap)
    .filter((entry) => entry[1] === shortKey)
    .map((entry) => entry[0])[0];

  if (res === undefined || !stringIsLongDurationString(res)) {
    throw new Error(`short duration key "${shortKey}" not found`);
  } else {
    return res;
  }
}

// represents a Duration from a number of seconds
export const DurationFromSeconds = new t.Type<Duration, number, unknown>(
  "DurationFromSeconds",
  Duration.is,
  (u, c) => {
    try {
      const seconds = decodeOrThrow(t.number)(u);

      const res = getDurationFromSeconds(seconds);

      return t.success(res);
    } catch (e) {
      return t.failure(e, c);
    }
  },
  (a) => {
    return durationToSeconds(a);
  }
);
