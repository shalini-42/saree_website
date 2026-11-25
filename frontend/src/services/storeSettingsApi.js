
import axios from "axios";

const storeSettingsApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export const getStoreSettings = async () => {
  const response = await storeSettingsApi.get("store/settings/");
  return response.data;
};

export default storeSettingsApi;
