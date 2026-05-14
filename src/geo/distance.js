import { getDistance }
from "geolib";

export function calculateDistance(
  start,
  end
) {

  return getDistance(
    start,
    end
  );
}
