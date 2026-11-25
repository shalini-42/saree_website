
import useStoreSettings from "./useStoreSettings";

export default function useShippingSettings() {
  const { settings, loading, error } = useStoreSettings();

  const shippingCharge = Number(settings?.shipping_charge ?? 0);
  const freeShippingMinimum = Number(
    settings?.free_shipping_minimum ?? 0
  );
  const estimatedDeliveryDays = Number(
    settings?.estimated_delivery_days ?? 0
  );

  const getShippingCharge = (subtotal) => {
    if (!settings) return 0;

    if (
      freeShippingMinimum > 0 &&
      subtotal >= freeShippingMinimum
    ) {
      return 0;
    }

    return shippingCharge;
  };

  return {
    loading,
    error,
    shippingCharge,
    freeShippingMinimum,
    estimatedDeliveryDays,
    getShippingCharge,
  };
}
