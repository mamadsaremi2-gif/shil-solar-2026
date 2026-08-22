export function validateProjectStep(step, data) {

  switch(step) {

    case "project-info":
      return !!data?.title;

    case "environment":
      return !!data?.province && !!data?.city;

    case "equipment":
      return Array.isArray(data) && data.length > 0;

    default:
      return true;
  }
}
