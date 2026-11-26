
import axios from "axios";

const storeSettingsApi = axios.create({
  baseURL: "https://saree-website-backend-seven.vercel.app/api/",
});

export const getStoreSettings = async () => {
  const response = await storeSettingsApi.get("store/settings/");
  return response.data;
};

export default storeSettingsApi;
