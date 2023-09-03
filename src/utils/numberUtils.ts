// doesn't round properly but gets you pretty close. Doesn't round down if .4
export const roundToNearestHundreth = (number: number) => {
  return Math.ceil(number * 100) / 100;
};
