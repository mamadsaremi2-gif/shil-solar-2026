export function calculateInverter(
  load,
  surge = 1.3
) {

  return Math.ceil(
    load * surge
  );
}
