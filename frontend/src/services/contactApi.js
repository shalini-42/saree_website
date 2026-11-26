
import axios from "axios";

const contactApi = axios.create({
  baseURL: "https://saree-website-backend-seven.vercel.app/api/",
});

export const submitContactMessage = async (formData) => {
  const response = await contactApi.post("contact/", formData);
  return response.data;
};

export default contactApi;
