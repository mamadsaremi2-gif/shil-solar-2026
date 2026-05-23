import axios from "axios";
import { backendConfig } from "../config/backendConfig.js";

export const apiClient = axios.create({
  baseURL: backendConfig.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("shil-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
