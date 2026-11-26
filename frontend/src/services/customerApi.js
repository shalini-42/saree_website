
import axios from "axios";

const customerApi = axios.create({
  baseURL: "https://saree-website-backend-seven.vercel.app/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach customer access token
customerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("customer_access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid customer sessions
customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("customer_access");

      if (token) {
        localStorage.removeItem("customer_access");
        localStorage.removeItem("customer_refresh");
        localStorage.removeItem("customer_username");
        localStorage.removeItem("customer_email");
        localStorage.removeItem("customer_cart_count");

        window.dispatchEvent(new Event("customerAuthChanged"));

        window.dispatchEvent(
          new CustomEvent("customerCartChanged", {
            detail: { count: 0 },
          })
        );

        window.dispatchEvent(
          new CustomEvent("customerWishlistChanged", {
            detail: { count: 0 },
          })
        );
      }
    }

    return Promise.reject(error);
  }
);

export default customerApi;
