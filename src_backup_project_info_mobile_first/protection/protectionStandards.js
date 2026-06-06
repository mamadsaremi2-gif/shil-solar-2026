export const STANDARD_BREAKER_RATINGS_A = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
export const STANDARD_FUSE_RATINGS_A = [1, 2, 4, 6, 10, 12, 15, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200];
export const STANDARD_SPD_VOLTAGES_V = [150, 275, 320, 385, 500, 600, 1000, 1500];

export function selectNextStandard(value, standards) {
  return standards.find((rating) => rating >= value) || standards[standards.length - 1];
}
