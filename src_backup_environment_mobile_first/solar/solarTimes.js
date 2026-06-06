import {
  getTimes
} from "solar-calculator";

export function getSolarTimes(
  date,
  latitude,
  longitude
) {

  return getTimes(
    date,
    latitude,
    longitude
  );
}
