

import axios from "axios";

const publicApi = axios.create({
  baseURL: "https://saree-website-backend-seven.vercel.app/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

export default publicApi;
