import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import { updateCustomerCartCount } from "../../services/customerCart";

import "./Wishlist.css";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const [removingId, setRemovingId] = useState(null);
  const [addingId, setAddingId] = useState(null);

  // Fetch wishlist
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerApi.get("customer/wishlist/");

      setWishlist(response.data.wishlist || []);
    } catch (err) {
      console.error("Wishlist fetch error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your personal collection. Please refresh or try again shortly."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Show notification
  const showNotice = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  };

  // Remove wishlist item
  const removeWishlistItem = async (productId) => {
    try {
      setRemovingId(productId);
      setNotice("");

      await customerApi.delete(
        `customer/wishlist/remove/${productId}/`
      );

      setWishlist((prev) =>
        prev.filter(
          (item) => Number(item.product) !== Number(productId)
        )
      );

      showNotice("Saree removed from your personal collection.");
    } catch (err) {
      console.error("Remove wishlist error:", err);

      showNotice(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to remove this saree.",
        "error"
      );
    } finally {
      setRemovingId(null);
    }
  };

  // Add saree to cart
  const addToCart = async (item) => {
    const productId = Number(item.product);
    const stock = Number(item.product_stock || 0);

    if (stock <= 0) {
      showNotice("This exclusive saree is currently out of stock.", "error");
      return;
    }

    try {
      setAddingId(productId);
      setNotice("");

      // Add one quantity to existing cart
      const response = await customerApi.post("cart/add/", {
        product: productId,
        quantity: 1,
      });

      // Update navbar cart count
      const cartCount = Number(
        response.data.cart?.total_items || 0
      );

      updateCustomerCartCount(cartCount);

      // Remove from wishlist only after successful cart addition
      try {
        await customerApi.delete(
          `customer/wishlist/remove/${productId}/`
        );

        setWishlist((prev) =>
          prev.filter(
            (wishlistItem) =>
              Number(wishlistItem.product) !== productId
          )
        );

        showNotice(
          `${item.product_name} has been moved to your shopping bag.`
        );
      } catch (removeError) {
        console.error(
          "Wishlist removal after cart addition failed:",
          removeError
        );

        showNotice(
          `${item.product_name} added to bag, but remains in your wishlist.`,
          "success"
        );
      }
    } catch (err) {
      console.error("Add to cart error:", err);

      showNotice(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to move this saree to your shopping bag.",
        "error"
      );
    } finally {
      setAddingId(null);
    }
  };

  // Product price
  const getPrice = (item) => {
    return Number(
      item.discount_price || item.product_price || 0
    );
  };

  // Discount percentage helper
  const getDiscountPercent = (item) => {
    const orig = Number(item.product_price || 0);
    const disc = Number(item.discount_price || 0);
    if (disc && orig && disc < orig) {
      return Math.round(((orig - disc) / orig) * 100);
    }
    return 0;
  };

  // Loading
  if (loading) {
    return (
      <div className="wishlist-loading">
        <div className="wishlist-loading-wrapper">
          <div className="wishlist-spinner"></div>
          <span className="wishlist-loading-brand">S Ā R I K A</span>
          <p>Unveiling your saved curation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">

        {/* EDITORIAL HEADER */}
        <header className="wishlist-heading">
          <div className="wishlist-heading-content">
            <div className="wishlist-eyebrow-container">
              <span className="wishlist-eyebrow-line"></span>
              <span className="wishlist-eyebrow">YOUR PERSONAL CURATION</span>
              <span className="wishlist-eyebrow-line"></span>
            </div>

            <h1 className="wishlist-title">My Saved Weaves</h1>

            <p className="wishlist-subtitle">
              Cherished Banarasi, Kanjivaram, and pure bridal silks curated for your memorable celebrations.
            </p>
          </div>

          <div className="wishlist-count-badge">
            <Heart size={16} className="wishlist-count-icon" fill="currentColor" />
            <span className="wishlist-count-number">{wishlist.length}</span>
            <span className="wishlist-count-text">
              {wishlist.length === 1 ? "Saree Saved" : "Sarees Saved"}
            </span>
          </div>
        </header>

        {/* NOTIFICATION TOAST */}
        {notice && (
          <div className={`wishlist-notice ${noticeType}`} role="status">
            <div className="wishlist-notice-inner">
              {noticeType === "success" ? (
                <CheckCircle2 size={18} className="wishlist-notice-icon success" />
              ) : (
                <AlertCircle size={18} className="wishlist-notice-icon error" />
              )}
              <span className="wishlist-notice-msg">{notice}</span>
            </div>

            <button
              type="button"
              className="wishlist-notice-close"
              onClick={() => setNotice("")}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="wishlist-error" role="alert">
            <AlertCircle size={20} />
            <p>{error}</p>
            <button
              type="button"
              className="wishlist-retry-btn"
              onClick={fetchWishlist}
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY WISHLIST */}
        {wishlist.length === 0 ? (
          <section className="wishlist-empty">
            <div className="wishlist-empty-ornament">
              <div className="wishlist-empty-ring"></div>
              <div className="wishlist-empty-icon">
                <Heart size={38} strokeWidth={1.2} />
              </div>
            </div>

            <span className="wishlist-empty-eyebrow">THE VAULT IS QUIET</span>
            <h2 className="wishlist-empty-title">Your collection awaits its first masterpiece</h2>

            <p className="wishlist-empty-description">
              Every drape at SĀRIKA is an authentic testament to Indian artisanal heritage.
              Explore our boutique collections and reserve the sarees you hold dear.
            </p>

            <Link to="/shop" className="wishlist-shop-btn">
              <span>Explore The Collection</span>
              <ArrowRight size={16} className="wishlist-btn-arrow" />
            </Link>
          </section>
        ) : (

          /* WISHLIST PRODUCTS GRID */
          <div className="wishlist-grid">
            {wishlist.map((item) => {
              const productId = Number(item.product);
              const stock = Number(item.product_stock || 0);
              const isAdding = addingId === productId;
              const isRemoving = removingId === productId;
              const discountPercent = getDiscountPercent(item);

              return (
                <article
                  className={`wishlist-card ${isRemoving ? "removing" : ""}`}
                  key={item.id}
                >
                  {/* CARD IMAGE CONTAINER */}
                  <div className="wishlist-image-container">
                    <Link
                      to={`/product/${productId}`}
                      className="wishlist-image-link"
                      tabIndex={-1}
                    >
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="wishlist-product-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="wishlist-no-image">
                          <ShoppingBag size={40} strokeWidth={1.2} />
                          <span>Heritage Saree</span>
                        </div>
                      )}
                      <div className="wishlist-image-overlay"></div>
                    </Link>

                    {/* BADGES */}
                    <div className="wishlist-card-badges">
                      {stock <= 0 ? (
                        <span className="wishlist-badge badge-out-stock">Sold Out</span>
                      ) : stock <= 3 ? (
                        <span className="wishlist-badge badge-low-stock">Only {stock} Left</span>
                      ) : discountPercent > 0 ? (
                        <span className="wishlist-badge badge-sale">{discountPercent}% Off</span>
                      ) : null}
                    </div>

                    {/* QUICK REMOVE BUTTON */}
                    <button
                      type="button"
                      className="wishlist-remove-btn"
                      onClick={() => removeWishlistItem(productId)}
                      disabled={isRemoving || isAdding}
                      title="Remove from wishlist"
                      aria-label={`Remove ${item.product_name} from wishlist`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* PRODUCT DETAILS */}
                  <div className="wishlist-card-content">
                    <div className="wishlist-meta-row">
                      <span className="wishlist-artisan-tag">Handcrafted Saree</span>
                      <span
                        className={`wishlist-stock-dot ${
                          stock > 0 ? "in-stock" : "out-stock"
                        }`}
                        title={stock > 0 ? "In Stock" : "Out of Stock"}
                      ></span>
                    </div>

                    <h3 className="wishlist-card-heading">
                      <Link
                        to={`/product/${productId}`}
                        className="wishlist-product-name"
                      >
                        {item.product_name}
                      </Link>
                    </h3>

                    {/* PRICING */}
                    <div className="wishlist-price">
                      <span className="wishlist-current-price">
                        ₹{getPrice(item).toLocaleString("en-IN")}
                      </span>

                      {item.discount_price &&
                        Number(item.discount_price) <
                          Number(item.product_price) && (
                          <del className="wishlist-original-price">
                            ₹
                            {Number(
                              item.product_price
                            ).toLocaleString("en-IN")}
                          </del>
                        )}
                    </div>

                    {/* AVAILABILITY TEXT */}
                    <p
                      className={
                        stock > 0
                          ? "wishlist-in-stock"
                          : "wishlist-out-stock"
                      }
                    >
                      {stock > 0
                        ? `Available In Stock (${stock} Pieces)`
                        : "Currently Unavailable"}
                    </p>

                    {/* ACTION BUTTONS */}
                    <div className="wishlist-card-actions">
                      <button
                        type="button"
                        className="wishlist-add-cart-btn"
                        onClick={() => addToCart(item)}
                        disabled={stock <= 0 || isAdding || isRemoving}
                      >
                        <ShoppingCart size={16} className="wishlist-cart-icon" />
                        <span>
                          {isAdding
                            ? "Adding to Bag..."
                            : stock <= 0
                            ? "Sold Out"
                            : "Add to Bag"}
                        </span>
                      </button>

                      <Link
                        to={`/product/${productId}`}
                        className="wishlist-view-btn"
                      >
                        <span>View Details</span>
                        <ArrowRight size={14} className="wishlist-view-arrow" />
                      </Link>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}