
import axios from "axios";

const api = axios.create({
  baseURL: "https://saree-website-backend-seven.vercel.app/api/",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
