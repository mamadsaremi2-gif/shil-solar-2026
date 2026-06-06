import axios from "axios";

const api = axios.create({
  timeout: 15000,
});

export default api;
