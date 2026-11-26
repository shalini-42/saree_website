
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  MapPin,
  ShoppingBag,
  CheckCircle2,
  LockKeyhole,
  Gift,
  AlertCircle,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import useShippingSettings from "../../hooks/useShippingSettings";
import useStoreSettings from "../../hooks/useStoreSettings";
import "./Checkout.css";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  payment_method: "COD",
};

const BACKEND_URL = "https://saree-website-backend-seven.vercel.app";

const validationFields = [
  "full_name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
];

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "object") {
    image = image.image || image.image_url || image.url;
  }

  if (!image) return "";

  return image.startsWith("http")
    ? image
    : `${BACKEND_URL}${image}`;
}

function validateField(name, value) {
  const val = String(value || "").trim();

  switch (name) {
    case "full_name":
      if (!val) return "Full name is required.";
      if (val.length < 3)
        return "Name must contain at least 3 characters.";
      if (!/^[a-zA-Z\s.'-]+$/.test(val))
        return "Enter a valid name.";
      return "";

    case "email":
      if (!val) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
        return "Enter a valid email address.";
      return "";

    case "phone":
      if (!val) return "Phone number is required.";
      if (!/^[6-9]\d{9}$/.test(val))
        return "Enter a valid 10-digit Indian mobile number.";
      return "";

    case "address":
      if (!val) return "Delivery address is required.";
      if (val.length < 10)
        return "Address must contain at least 10 characters.";
      return "";

    case "city":
      if (!val) return "City is required.";
      if (!/^[a-zA-Z\s.'-]+$/.test(val))
        return "Enter a valid city name.";
      return "";

    case "state":
      if (!val) return "State is required.";
      if (!/^[a-zA-Z\s.'-]+$/.test(val))
        return "Enter a valid state name.";
      return "";

    case "pincode":
      if (!val) return "PIN code is required.";
      if (!/^[1-9]\d{5}$/.test(val))
        return "Enter a valid 6-digit PIN code.";
      return "";

    default:
      return "";
  }
}

export default function Checkout() {
  const navigate = useNavigate();

  const {
    loading: shippingLoading,
    error: shippingError,
    shippingCharge,
    freeShippingMinimum,
    estimatedDeliveryDays,
    getShippingCharge,
  } = useShippingSettings();

  const {
    settings: storeSettings,
    loading: storeSettingsLoading,
  } = useStoreSettings();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);

  const codEnabled = storeSettings?.cod_enabled !== false;

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  useEffect(() => {
    if (!localStorage.getItem("customer_access")) {
      navigate("/customer/login", { replace: true });
      return;
    }

    fetchCheckoutData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerApi.get("cart/");
      const cartData = response.data;

      if (!cartData.items || cartData.items.length === 0) {
        navigate("/cart", { replace: true });
        return;
      }

      setCart(cartData);

      setForm((previous) => ({
        ...previous,
        email: localStorage.getItem("customer_email") || "",
        payment_method: "COD",
      }));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load your cart. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "payment_method") return;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: validateField(name, value),
    }));

    setError("");
  };

  const validateForm = () => {
    const newErrors = {};

    validationFields.forEach((field) => {
      const message = validateField(field, form[field]);

      if (message) {
        newErrors[field] = message;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const subtotal = Number(cart?.subtotal || 0);

  const shippingAvailable = !shippingLoading && !shippingError;

  const currentShipping = shippingAvailable
    ? Number(getShippingCharge(subtotal) || 0)
    : 0;

  const total = subtotal + currentShipping;

  const qualifiesForFreeShipping =
    shippingAvailable &&
    freeShippingMinimum > 0 &&
    subtotal >= freeShippingMinimum;

  const remainingForFreeShipping = Math.max(
    0,
    Number(freeShippingMinimum || 0) - subtotal
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (placingOrder) return;

    setError("");

    if (!validateForm()) {
      setError("Please correct the highlighted fields.");
      return;
    }

    if (!shippingAvailable) {
      setError(
        "Shipping information is currently unavailable. Please try again."
      );
      return;
    }

    if (!codEnabled) {
      setError(
        "Cash on Delivery is currently unavailable. Please contact the store."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const orderData = {
        ...form,
        payment_method: "COD",
      };

      const response = await customerApi.post(
        "orders/checkout/",
        orderData
      );

      setSuccessOrder(response.data.order);

      localStorage.setItem("customer_cart_count", "0");

      window.dispatchEvent(
        new CustomEvent("customerCartChanged", {
          detail: { count: 0 },
        })
      );
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const backendErrors = {};

        validationFields.forEach((field) => {
          if (data[field]) {
            backendErrors[field] = Array.isArray(data[field])
              ? data[field][0]
              : data[field];
          }
        });

        if (Object.keys(backendErrors).length > 0) {
          setErrors((previous) => ({
            ...previous,
            ...backendErrors,
          }));
        }
      }

      setError(
        data?.error ||
          data?.detail ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading || shippingLoading || storeSettingsLoading) {
    return (
      <div className="sarika-checkout-loading">
        <div className="sarika-checkout-spinner"></div>
        <p>Preparing your elegant checkout...</p>
      </div>
    );
  }

  // ORDER SUCCESS SCREEN
  if (successOrder) {
    return (
      <div className="sarika-order-success">
        <div className="sarika-success-card">
          <div className="sarika-success-icon">
            <CheckCircle2 size={42} />
          </div>

          <span className="sarika-checkout-eyebrow">
            SĀRIKA · ORDER CONFIRMED
          </span>

          <h1>Thank you for your order</h1>

          <p>
            Your saree selection is now part of your SĀRIKA journey.
            We will carefully prepare your order.
          </p>

          <div className="sarika-order-number">
            <span>ORDER NUMBER</span>
            <strong>{successOrder.order_number}</strong>
          </div>

          <div className="sarika-success-total">
            <span>Order Total</span>
            <strong>
              ₹{formatPrice(successOrder.total_amount)}
            </strong>
          </div>

          <p className="sarika-cod-note">
            Payment method: Cash on Delivery
          </p>

          <button
            className="sarika-checkout-primary"
            onClick={() => navigate("/my-orders")}
          >
            View My Orders
          </button>

          <Link to="/shop" className="sarika-continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="sarika-checkout-page">
      <div className="sarika-checkout-container">
        <Link to="/cart" className="sarika-checkout-back">
          <ArrowLeft size={17} />
          Back to Cart
        </Link>

        <div className="sarika-checkout-heading">
          <span>THE SĀRIKA EXPERIENCE</span>
          <h1>Complete Your Order</h1>
          <p>
            A beautiful selection deserves a beautiful experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="sarika-checkout-layout">
            {/* DELIVERY INFORMATION */}
            <section className="sarika-checkout-left">
              <div className="sarika-checkout-section">
                <div className="sarika-section-heading">
                  <div className="sarika-section-icon">
                    <MapPin size={20} />
                  </div>

                  <div>
                    <h2>Delivery Information</h2>
                    <p>
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                <div className="sarika-form-grid">
                  <div className="sarika-form-group full-width">
                    <label htmlFor="full_name">Full Name *</label>

                    <input
                      id="full_name"
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      maxLength={150}
                      autoComplete="name"
                      aria-invalid={Boolean(errors.full_name)}
                    />

                    {errors.full_name && (
                      <small className="sarika-field-error">
                        {errors.full_name}
                      </small>
                    )}
                  </div>

                  <div className="sarika-form-group">
                    <label htmlFor="email">Email Address *</label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                    />

                    {errors.email && (
                      <small className="sarika-field-error">
                        {errors.email}
                      </small>
                    )}
                  </div>

                  <div className="sarika-form-group">
                    <label htmlFor="phone">Phone Number *</label>

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.phone)}
                    />

                    {errors.phone && (
                      <small className="sarika-field-error">
                        {errors.phone}
                      </small>
                    )}
                  </div>

                  <div className="sarika-form-group full-width">
                    <label htmlFor="address">Street Address *</label>

                    <textarea
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="House number, street, area, landmark"
                      rows="3"
                      maxLength={500}
                      autoComplete="street-address"
                      aria-invalid={Boolean(errors.address)}
                    />

                    {errors.address && (
                      <small className="sarika-field-error">
                        {errors.address}
                      </small>
                    )}
                  </div>

                  <div className="sarika-form-group">
                    <label htmlFor="city">City *</label>

                    <input
                      id="city"
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      autoComplete="address-level2"
                      aria-invalid={Boolean(errors.city)}
                    />

                    {errors.city && (
                      <small className="sarika-field-error">
                        {errors.city}
                      </small>
                    )}
                  </div>

                  <div className="sarika-form-group">
                    <label htmlFor="state">State *</label>

                    <input
                      id="state"
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                      autoComplete="address-level1"
                      aria-invalid={Boolean(errors.state)}
                    />

                    {errors.state && (
                      <small className="sarika-field-error">
                        {errors.state}
                      </small>
                    )}
                  </div>

                  <div className="sarika-form-group">
                    <label htmlFor="pincode">PIN Code *</label>

                    <input
                      id="pincode"
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      aria-invalid={Boolean(errors.pincode)}
                    />

                    {errors.pincode && (
                      <small className="sarika-field-error">
                        {errors.pincode}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD */}
              <div className="sarika-checkout-section">
                <div className="sarika-section-heading">
                  <div className="sarika-section-icon">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <h2>Payment Method</h2>
                    <p>
                      Choose your available payment option.
                    </p>
                  </div>
                </div>

                {codEnabled ? (
                  <>
                    <label className="sarika-payment-option">
                      <input
                        type="radio"
                        name="payment_method"
                        value="COD"
                        checked={form.payment_method === "COD"}
                        readOnly
                      />

                      <div className="sarika-payment-details">
                        <strong>Cash on Delivery</strong>
                        <span>
                          Pay when your order arrives at your doorstep.
                        </span>
                      </div>

                      <span className="sarika-payment-tag">
                        AVAILABLE
                      </span>
                    </label>

                    <div className="sarika-payment-secure">
                      <LockKeyhole size={15} />
                      Your order information is protected.
                    </div>
                  </>
                ) : (
                  <div className="sarika-checkout-error">
                    Cash on Delivery is currently unavailable.
                  </div>
                )}
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <aside className="sarika-checkout-summary">
              <div className="sarika-summary-header">
                <div>
                  <span>YOUR SELECTION</span>
                  <h2>Order Summary</h2>
                </div>

                <ShoppingBag size={23} />
              </div>

              <div className="sarika-summary-items">
                {cart?.items?.map((item) => {
                  const image = getImageUrl(item.product_image);

                  return (
                    <div
                      className="sarika-summary-product"
                      key={item.id}
                    >
                      <div className="sarika-summary-image">
                        {image ? (
                          <img
                            src={image}
                            alt={item.product_name}
                          />
                        ) : (
                          <div className="sarika-no-product-image">
                            <ShoppingBag size={22} />
                          </div>
                        )}

                        <span>{item.quantity}</span>
                      </div>

                      <div className="sarika-summary-product-info">
                        <h3>{item.product_name}</h3>

                        <p>
                          ₹{formatPrice(item.product_price)}
                        </p>
                      </div>

                      <strong>
                        ₹{formatPrice(item.subtotal)}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="sarika-summary-calculation">
                <div>
                  <span>Subtotal</span>
                  <strong>₹{formatPrice(subtotal)}</strong>
                </div>

                <div>
                  <span>Shipping</span>

                  <strong
                    className={
                      currentShipping === 0
                        ? "sarika-free-shipping"
                        : ""
                    }
                  >
                    {shippingError
                      ? "Unavailable"
                      : currentShipping === 0
                      ? "FREE"
                      : `₹${formatPrice(currentShipping)}`}
                  </strong>
                </div>

                {qualifiesForFreeShipping && (
                  <div className="sarika-free-shipping-success">
                    <Gift size={16} />
                    Congratulations! You qualify for free shipping.
                  </div>
                )}

                {!qualifiesForFreeShipping &&
                  freeShippingMinimum > 0 &&
                  remainingForFreeShipping > 0 && (
                    <div className="sarika-free-shipping-box">
                      <Gift size={16} />
                      <span>
                        Add ₹{formatPrice(remainingForFreeShipping)} more
                        to unlock free shipping.
                      </span>
                    </div>
                  )}

                <div className="sarika-summary-grand-total">
                  <span>Total Amount</span>
                  <strong>₹{formatPrice(total)}</strong>
                </div>
              </div>

              {estimatedDeliveryDays > 0 && (
                <div className="sarika-delivery-promise">
                  <Truck size={19} />
                  <span>
                    Estimated delivery: {estimatedDeliveryDays}{" "}
                    {estimatedDeliveryDays === 1 ? "day" : "days"}
                  </span>
                </div>
              )}

              {shippingError && (
                <div className="sarika-checkout-error" role="alert">
                  <AlertCircle size={16} />
                  Shipping settings could not be loaded. Please refresh
                  the page and try again.
                </div>
              )}

              {error && (
                <div className="sarika-checkout-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="sarika-checkout-primary"
                disabled={
                  placingOrder ||
                  !cart?.items?.length ||
                  !shippingAvailable ||
                  !codEnabled
                }
              >
                {placingOrder
                  ? "Placing Your Order..."
                  : "Place Order"}
              </button>

              <p className="sarika-checkout-terms">
                By placing your order, you agree to our terms
                and conditions.
              </p>

              <div className="sarika-payment-secure">
                <LockKeyhole size={15} />
                Secure checkout experience
              </div>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}
