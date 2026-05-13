import axios from "axios";

export async function fetchNasaPower(lat, lon) {
  const url =
    `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`;

  const response = await axios.get(url);

  return response.data;
}
