export const iranEnvironmentDefaults = {
  irradiance: 5.2,
  temperature: 25,
  altitude: 1200
};

export function generateEnvironment(city, province) {
  return {
    city,
    province,
    ...iranEnvironmentDefaults
  };
}
