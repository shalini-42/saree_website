
export const updateCustomerCartCount = (count) => {
  const safeCount = Number(count) || 0;

  localStorage.setItem(
    "customer_cart_count",
    String(safeCount)
  );

  window.dispatchEvent(
    new CustomEvent("customerCartChanged", {
      detail: { count: safeCount },
    })
  );
};
