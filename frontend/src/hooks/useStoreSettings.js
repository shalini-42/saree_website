
import { useEffect, useState } from "react";
import { getStoreSettings } from "../services/storeSettingsApi";

export default function useStoreSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getStoreSettings();
        setSettings(data);
      } catch (err) {
        console.error("Store settings error:", err);
        setError("Unable to load store settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
