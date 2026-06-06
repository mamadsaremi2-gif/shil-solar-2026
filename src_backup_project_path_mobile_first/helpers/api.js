import axios from "axios";

export const api = axios.create({
  baseURL:
    "https://shil-engine-api.onrender.com",

  timeout: 15000,
});
