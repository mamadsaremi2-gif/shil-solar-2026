export function calculateVoltageDrop(
  current,
  length,
  area
) {

  const resistivity = 0.0175;

  return (
    (2 *
      resistivity *
      length *
      current) /
    area
  );
}
