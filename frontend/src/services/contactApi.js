
import axios from "axios";

const contactApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export const submitContactMessage = async (formData) => {
  const response = await contactApi.post("contact/", formData);
  return response.data;
};

export default contactApi;
