import { intervalToDuration } from "date-fns";

export const convertIntervalToMinutes = (interval: {
  start: Date;
  end: Date;
}) => {
  console.warn(
    "This function is guardless! What if the duration spans days, weeks, months, or year?"
  );
  const duration = intervalToDuration(interval);
  const durationInMinutes =
    (duration.minutes ?? 0) + (duration.hours ?? 0 * 60);
  return durationInMinutes;
};
