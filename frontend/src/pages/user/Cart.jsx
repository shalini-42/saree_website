
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  ShoppingCart,
  AlertCircle,
  Truck,
  Gift,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import { updateCustomerCartCount } from "../../services/customerCart";
import useShippingSettings from "../../hooks/useShippingSettings";

import "./Cart.css";

function Cart() {
  const navigate = useNavigate();

  const {
    loading: shippingLoading,
    error: shippingError,
    shippingCharge,
    freeShippingMinimum,
    estimatedDeliveryDays,
    getShippingCharge,
  } = useShippingSettings();

  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // SHIPPING CALCULATIONS
  const shippingAvailable = !shippingLoading && !shippingError;

  const currentShipping = shippingAvailable
    ? getShippingCharge(subtotal)
    : 0;

  const remainingForFreeShipping = Math.max(
    0,
    freeShippingMinimum - subtotal
  );

  const qualifiesForFreeShipping =
    shippingAvailable &&
    freeShippingMinimum > 0 &&
    subtotal >= freeShippingMinimum;

  const estimatedTotal = subtotal + currentShipping;

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  // Update cart state and navbar badge together
  const syncCart = (data) => {
    const cartItems = data.items || [];
    const count = Number(data.total_items || 0);
    const cartSubtotal = Number(data.subtotal || 0);

    setItems(cartItems);
    setTotalItems(count);
    setSubtotal(cartSubtotal);

    updateCustomerCartCount(count);
  };

  // Fetch customer cart
  const fetchCart = async () => {
    const token = localStorage.getItem("customer_access");

    if (!token) {
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      updateCustomerCartCount(0);
      setLoading(false);
      setError("Please sign in to view your shopping bag.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await customerApi.get("cart/");

      syncCart(response.data);
    } catch (err) {
      console.error("Cart fetch error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            "Unable to load your shopping bag."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update quantity
  const updateQuantity = async (item, type) => {
    const newQuantity =
      type === "increase"
        ? item.quantity + 1
        : item.quantity - 1;

    if (newQuantity < 1) return;

    setUpdatingId(item.id);
    setNotice("");

    try {
      const response = await customerApi.patch(
        `cart/update/${item.id}/`,
        { quantity: newQuantity }
      );

      if (response.data.cart) {
        syncCart(response.data.cart);
      } else {
        await fetchCart();
      }

      setNotice("Your shopping bag has been updated.");
    } catch (err) {
      console.error("Update quantity error:", err);

      setNotice(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to update quantity. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Remove one item
  const removeItem = async (itemId) => {
    setRemovingId(itemId);
    setNotice("");

    try {
      const response = await customerApi.delete(
        `cart/remove/${itemId}/`
      );

      setNotice(
        response.data.message ||
          "Saree removed from your shopping bag."
      );

      await fetchCart();
    } catch (err) {
      console.error("Remove item error:", err);

      setNotice(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to remove this saree."
      );
    } finally {
      setRemovingId(null);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (items.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove all sarees from your shopping bag?"
    );

    if (!confirmed) return;

    setClearing(true);
    setNotice("");

    try {
      const response = await customerApi.delete("cart/clear/");

      setItems([]);
      setTotalItems(0);
      setSubtotal(0);

      updateCustomerCartCount(0);

      setNotice(
        response.data.message ||
          "Your shopping bag is now empty."
      );
    } catch (err) {
      console.error("Clear cart error:", err);

      setNotice(
        err.response?.data?.error ||
          "Unable to clear your shopping bag."
      );
    } finally {
      setClearing(false);
    }
  };

  // Checkout
  const handleCheckout = () => {
    if (!localStorage.getItem("customer_access")) {
      navigate("/customer/login");
      return;
    }

    navigate("/checkout");
  };

  // Loading
  if (loading || shippingLoading) {
    return (
      <div className="sarika-cart-loading">
        <div className="sarika-cart-spinner" />
        <p>Preparing your shopping bag...</p>
      </div>
    );
  }

  // Login required or cart error
  if (error) {
    return (
      <main className="sarika-cart-page">
        <div className="sarika-cart-message">
          <ShoppingBag size={42} />

          <h2>Welcome to Your Shopping Bag</h2>

          <p>{error}</p>

          <button
            className="sarika-cart-primary"
            onClick={() => navigate("/customer/login")}
          >
            SIGN IN TO CONTINUE
          </button>

          <Link to="/shop" className="sarika-cart-back">
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="sarika-cart-page">
      <div className="sarika-cart-container">

        {/* HEADING */}
        <div className="sarika-cart-heading">
          <span>THE SĀRIKA COLLECTION</span>

          <h1>Your Shopping Bag</h1>

          <p>Beautiful choices, thoughtfully selected.</p>
        </div>

        <div className="sarika-cart-divider">
          <span>✦</span>
        </div>

        {/* NOTIFICATION */}
        {notice && (
          <div className="sarika-cart-notice">
            <AlertCircle size={17} />

            <span>{notice}</span>

            <button onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}

        {items.length === 0 ? (

          /* EMPTY CART */
          <div className="sarika-cart-empty">
            <div className="sarika-cart-empty-icon">
              <ShoppingCart size={38} />
            </div>

            <h2>Your Bag Awaits Something Beautiful</h2>

            <p>
              You haven't added any sarees to your shopping
              bag yet. Discover a collection made for timeless
              elegance.
            </p>

            <Link
              to="/shop"
              className="sarika-cart-primary"
            >
              EXPLORE THE COLLECTION
            </Link>
          </div>

        ) : (

          <>
            {/* CART TOP */}
            <div className="sarika-cart-topline">
              <span>
                {totalItems} ITEM(S) IN YOUR BAG
              </span>

              <button
                className="sarika-cart-clear"
                onClick={clearCart}
                disabled={clearing}
              >
                <Trash2 size={15} />

                {clearing ? "Clearing..." : "Clear Bag"}
              </button>
            </div>

            <div className="sarika-cart-layout">

              {/* CART ITEMS */}
              <section className="sarika-cart-items">
                {items.map((item) => {
                  const itemPrice = Number(
                    item.product_price || 0
                  );

                  const itemSubtotal = Number(
                    item.subtotal || 0
                  );

                  return (
                    <article
                      className="sarika-cart-item"
                      key={item.id}
                    >
                      {/* IMAGE */}
                      <Link
                        to={`/product/${item.product}`}
                        className="sarika-cart-image"
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                          />
                        ) : (
                          <div className="sarika-cart-no-image">
                            <ShoppingBag size={28} />
                          </div>
                        )}
                      </Link>

                      {/* DETAILS */}
                      <div className="sarika-cart-item-info">
                        <span className="sarika-cart-item-label">
                          SĀRIKA · HANDPICKED ELEGANCE
                        </span>

                        <Link
                          to={`/product/${item.product}`}
                          className="sarika-cart-item-name"
                        >
                          {item.product_name}
                        </Link>

                        <p className="sarika-cart-item-price">
                          ₹{formatPrice(itemPrice)}
                        </p>

                        {/* QUANTITY */}
                        <div className="sarika-cart-controls">
                          <div className="sarika-cart-quantity">
                            <button
                              onClick={() =>
                                updateQuantity(item, "decrease")
                              }
                              disabled={
                                item.quantity <= 1 ||
                                updatingId === item.id
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>

                            <span>
                              {updatingId === item.id
                                ? "..."
                                : item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(item, "increase")
                              }
                              disabled={updatingId === item.id}
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          {/* REMOVE */}
                          <button
                            className="sarika-cart-remove"
                            onClick={() => removeItem(item.id)}
                            disabled={removingId === item.id}
                          >
                            <Trash2 size={14} />

                            {removingId === item.id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </div>
                      </div>

                      {/* ITEM TOTAL */}
                      <div className="sarika-cart-item-total">
                        ₹{formatPrice(itemSubtotal)}
                      </div>
                    </article>
                  );
                })}
              </section>

              {/* ORDER SUMMARY */}
              <aside className="sarika-cart-summary">
                <span className="sarika-cart-summary-label">
                  ORDER SUMMARY
                </span>

                <h2>Your Selection</h2>

                <div className="sarika-cart-summary-row">
                  <span>Total Items</span>
                  <strong>{totalItems}</strong>
                </div>

                <div className="sarika-cart-summary-row">
                  <span>Subtotal</span>

                  <strong>
                    ₹{formatPrice(subtotal)}
                  </strong>
                </div>

                {/* DYNAMIC SHIPPING */}
                <div className="sarika-cart-summary-row">
                  <span className="sarika-shipping-label">
                    <Truck size={15} />
                    Shipping
                  </span>

                  <strong>
                    {!shippingAvailable
                      ? "At checkout"
                      : qualifiesForFreeShipping
                        ? "FREE"
                        : `₹${formatPrice(shippingCharge)}`}
                  </strong>
                </div>

                {/* FREE SHIPPING MESSAGE */}
                {shippingAvailable &&
                  freeShippingMinimum > 0 && (
                    <div className="sarika-free-shipping-box">
                      {qualifiesForFreeShipping ? (
                        <div className="sarika-free-shipping-success">
                          <Gift size={19} />

                          <div>
                            <strong>
                              You've unlocked free shipping!
                            </strong>

                            <p>
                              Enjoy complimentary delivery on this order.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="sarika-free-shipping-progress">
                          <Gift size={19} />

                          <div>
                            <strong>
                              You're close to free shipping!
                            </strong>

                            <p>
                              Add ₹
                              {formatPrice(
                                remainingForFreeShipping
                              )}{" "}
                              more to unlock free delivery.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* DELIVERY ESTIMATE */}
                {shippingAvailable &&
                  estimatedDeliveryDays > 0 && (
                    <div className="sarika-delivery-estimate">
                      <Truck size={17} />

                      <span>
                        Estimated delivery:{" "}
                        <strong>
                          {estimatedDeliveryDays}{" "}
                          {estimatedDeliveryDays === 1
                            ? "day"
                            : "days"}
                        </strong>
                      </span>
                    </div>
                  )}

                {/* SHIPPING API ERROR */}
                {shippingError && (
                  <div className="sarika-shipping-error">
                    <AlertCircle size={15} />

                    <span>
                      Shipping details are temporarily unavailable.
                      Final charges will be confirmed at checkout.
                    </span>
                  </div>
                )}

                {/* FINAL TOTAL */}
                <div className="sarika-cart-summary-total">
                  <span>Estimated Total</span>

                  <strong>
                    {shippingAvailable
                      ? `₹${formatPrice(estimatedTotal)}`
                      : "At checkout"}
                  </strong>
                </div>

                <button
                  className="sarika-cart-checkout"
                  onClick={handleCheckout}
                >
                  CONTINUE TO CHECKOUT
                </button>

                <div className="sarika-cart-assurance">
                  <ShieldCheck size={19} />
                  <span>Secure shopping experience</span>
                </div>

                <Link
                  to="/shop"
                  className="sarika-cart-continue"
                >
                  <ArrowLeft size={15} />
                  Continue Shopping
                </Link>
              </aside>
            </div>
          </>
        )}

        <div className="sarika-cart-footer-note">
          <ShieldCheck size={17} />

          <span>
            Every SĀRIKA creation is selected with care.
          </span>
        </div>
      </div>
    </main>
  );
}

export default Cart;
