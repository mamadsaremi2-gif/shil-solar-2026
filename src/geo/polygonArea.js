import * as turf from "@turf/turf";

export function createPolygonArea(
  coordinates
) {

  const polygon =
    turf.polygon([coordinates]);

  return turf.area(polygon);
}
