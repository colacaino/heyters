import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const instance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // IMPORTANTE: Permite enviar/recibir cookies
});

// interceptor para agregar el token
instance.interceptors.request.use((config) => {
  const accessToken = window.localStorage.getItem("accessTokenTemp");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export default instance;
