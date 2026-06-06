import axios from "axios";

export async function fetchSolcast(
  lat,
  lon,
  apiKey
) {

  const response =
    await axios.get(
      `https://api.solcast.com.au/world_radiation/estimated_actuals?latitude=${lat}&longitude=${lon}&api_key=${apiKey}`
    );

  return response.data;
}
