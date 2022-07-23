import {
  add,
  addSeconds,
  differenceInSeconds,
  Duration,
  intervalToDuration,
} from "date-fns";
import * as assert from "../assert";
import { omitNullish } from "../obj";

export * from "./locales/shortEng";

export function getDurationFromSeconds(totalSeconds: number): Duration {
  const baseDate = new Date(0);

  const newDate = addSeconds(baseDate, totalSeconds);

  return omitNullish(
    intervalToDuration({
      start: baseDate,
      end: newDate,
    })
  );
}

export const durationToSeconds = (duration: Duration) => {
  const baseDate = new Date(0);

  const newDate = add(baseDate, duration);
  return differenceInSeconds(newDate, baseDate);
};

export const sumDuration = (...durations: Duration[]): Duration => {
  return flatMapDurationValues(
    (values) => values.reduce((prev, next) => prev + next, 0),
    ...durations
  );
};

export const flatMapDurationValues = (
  flattenValues: (values: number[]) => number,
  ...durations: Duration[]
): Duration => {
  const years = flattenValues(durations.map((duration) => duration.years ?? 0));
  const months = flattenValues(
    durations.map((duration) => duration.months ?? 0)
  );
  const weeks = flattenValues(durations.map((duration) => duration.weeks ?? 0));
  const days = flattenValues(durations.map((duration) => duration.days ?? 0));
  const hours = flattenValues(durations.map((duration) => duration.hours ?? 0));
  const minutes = flattenValues(
    durations.map((duration) => duration.minutes ?? 0)
  );
  const seconds = flattenValues(
    durations.map((duration) => duration.seconds ?? 0)
  );

  return omitNullish({
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
  });
};

/** adjusts the keys of duration to make sense e.g. 130m => 2h 10m */
export const normaliseDuration = (
  duration: Duration,
  defaultDuration: Duration = { minutes: 0 }
): Duration => {
  const baseDate = new Date(0);

  const newDate = add(baseDate, duration);

  return {
    ...defaultDuration,
    ...omitNullish(
      intervalToDuration({
        start: baseDate,
        end: newDate,
      })
    ),
  };
};

/**
 * returns the greater duration
 */
export function maxDuration(...durationParams: Duration[]) {
  const firstDuration = durationParams[0];
  assert.invariant(
    firstDuration !== undefined,
    "maxDuration requires at least 1 duration"
  );
  let largestDuration = firstDuration;
  let largestSeconds = durationToSeconds(firstDuration);

  for (const thisDuration of durationParams) {
    const seconds = durationToSeconds(thisDuration);

    if (seconds > largestSeconds) {
      largestSeconds = seconds;
      largestDuration = thisDuration;
    }
  }

  return largestDuration;
}
