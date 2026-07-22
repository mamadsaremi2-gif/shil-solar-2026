import { getDistance } from "geolib";
import * as turf from "@turf/turf";

export function calculateSiteDistance(start, end) {
  return getDistance(start, end);
}

export function calculateSiteArea(points) {
  const polygon = turf.polygon([points]);
  return turf.area(polygon);
}

export function estimateTilt(latitude) {
  return Math.round(Math.abs(latitude) * 0.9);
}
