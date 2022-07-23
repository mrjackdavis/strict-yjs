// copied from https://github.com/date-fns/date-fns/blob/master/src/locale/en-US/_lib/formatDistance/index.js
const formatDistanceLocale = {
  lessThanXSeconds: {
    one: "< 1s",
    other: "< {{count}}s",
  },

  xSeconds: {
    one: "1s",
    other: "{{count}}s",
  },

  halfAMinute: "half a minute",

  lessThanXMinutes: {
    one: "< 1m",
    other: "< {{count}}m",
  },

  xMinutes: {
    one: "1m",
    other: "{{count}}m",
  },

  aboutXHours: {
    one: "~ 1h",
    other: "~ {{count}}h",
  },

  xHours: {
    one: "1h",
    other: "{{count}}h",
  },

  xDays: {
    one: "1d",
    other: "{{count}}d",
  },

  aboutXWeeks: {
    one: "~ 1w",
    other: "~ {{count}}w",
  },

  xWeeks: {
    one: "1w",
    other: "{{count}}w",
  },

  aboutXMonths: {
    one: "~ 1 month",
    other: "~ {{count}} months",
  },

  xMonths: {
    one: "1 month",
    other: "{{count}} months",
  },

  aboutXYears: {
    one: "~ 1 year",
    other: "~ {{count}} years",
  },

  xYears: {
    one: "1 year",
    other: "{{count}} years",
  },

  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years",
  },

  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years",
  },
};

export function formatDistance(
  token: keyof typeof formatDistanceLocale,
  count: number,
  options: { addSuffix?: boolean; comparison?: number } = {}
) {
  let result: string;

  const foundToken = formatDistanceLocale[token];

  if (typeof foundToken === "string") {
    result = foundToken;
  } else if (count === 1) {
    result = foundToken.one;
  } else {
    result = foundToken.other.replace("{{count}}", count.toString());
  }

  if (options.addSuffix) {
    if ((options.comparison ?? 0) > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }

  return result;
}
