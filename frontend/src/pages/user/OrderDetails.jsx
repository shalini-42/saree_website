import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  MapPin,
  CreditCard,
  RotateCcw,
  X,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import useStoreSettings from "../../hooks/useStoreSettings";
import "./OrderDetails.css";

const BACKEND_URL = "http://127.0.0.1:8000";

const RETURN_REASONS = [
  "Damaged Product",
  "Wrong Product",
  "Different from Description",
  "Size or Design Issue",
  "Quality Issue",
  "Other",
];

// ========================================
// PRICE FORMAT
// ========================================

const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ========================================
// DATE FORMAT
// ========================================

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ========================================
// ERROR MESSAGE
// ========================================

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (data?.message) return data.message;
  if (data?.detail) return data.detail;

  if (data?.errors) {
    return Object.values(data.errors).flat().join(" ");
  }

  if (data?.error) return data.error;

  return "Something went wrong. Please try again.";
};

// ========================================
// IMAGE URL HELPER
// ========================================

const getProductImage = (item) => {
  if (!item) return "";

  let image =
    item.product_image ||
    item.image ||
    item.thumbnail ||
    item.product?.product_image ||
    item.product?.image ||
    item.product?.thumbnail;

  if (image && typeof image === "object") {
    image = image.image || image.url || image.src;
  }

  if (!image && Array.isArray(item.images) && item.images.length > 0) {
    const primaryImage =
      item.images.find((img) => img.is_primary) || item.images[0];

    image =
      typeof primaryImage === "string"
        ? primaryImage
        : primaryImage?.image || primaryImage?.url;
  }

  if (!image || typeof image !== "string") return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${BACKEND_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

/* Product thumbnail with a graceful fallback (no DOM mutation) */
function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="od-image-fallback" role="img" aria-label={alt}>
        <ImageIcon size={26} aria-hidden="true" />
        <span>SĀRIKA Weave</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={160}
      height={200}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dynamic Store Settings
  const { settings } = useStoreSettings();

  const storeName = settings?.store_name || "SĀRIKA";
  const storeTagline = settings?.tagline || "The Art of Elegance";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heroFailed, setHeroFailed] = useState(false);

  // Return / Exchange states
  const [returnRequests, setReturnRequests] = useState([]);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);

  const [returnType, setReturnType] = useState("Return");
  const [returnReason, setReturnReason] = useState("Damaged Product");
  const [returnDescription, setReturnDescription] = useState("");

  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState("");

  // Result popup
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState("success");
  const [resultModalMessage, setResultModalMessage] = useState("");

  // Cancel order
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Invoice
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // ========================================
  // FETCH ORDER
  // ========================================

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerApi.get(`orders/my-orders/${id}/`);

      setOrder(response.data);

      try {
        const returnsResponse = await customerApi.get("orders/my-returns/");

        const requests = Array.isArray(returnsResponse.data)
          ? returnsResponse.data
          : returnsResponse.data?.results || [];

        setReturnRequests(
          requests.filter(
            (request) => Number(request.order) === Number(response.data.id)
          )
        );
      } catch (returnFetchError) {
        console.error("Unable to load return requests:", returnFetchError);
      }
    } catch (err) {
      console.error("Order loading error:", err);

      setError(getErrorMessage(err));

      if (err.response?.status === 401) {
        navigate("/customer/login");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Escape closes whichever dialog is open
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (showResultModal) setShowResultModal(false);
      else if (showReturnDialog && !returnLoading) setShowReturnDialog(false);
      else if (showCancelDialog && !cancelLoading) setShowCancelDialog(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResultModal, showReturnDialog, showCancelDialog, returnLoading, cancelLoading]);

  // ========================================
  // RESULT POPUP
  // ========================================

  const showResult = (type, message) => {
    setResultModalType(type);
    setResultModalMessage(message);
    setShowResultModal(true);
  };

  // ========================================
  // OPEN RETURN DIALOG
  // ========================================

  const handleOpenReturnDialog = (item) => {
    setSelectedReturnItem(item);
    setReturnType("Return");
    setReturnReason("Damaged Product");
    setReturnDescription("");
    setReturnError("");
    setShowReturnDialog(true);
  };

  // ========================================
  // SUBMIT RETURN / EXCHANGE
  // ========================================

  const handleReturnSubmit = async (event) => {
    event.preventDefault();

    if (!selectedReturnItem) return;

    try {
      setReturnLoading(true);
      setReturnError("");

      const response = await customerApi.post("orders/return-exchange/", {
        order_item: selectedReturnItem.id,
        request_type: returnType,
        reason: returnReason,
        description: returnDescription,
      });

      const createdRequest = response.data?.request;

      if (createdRequest) {
        setReturnRequests((previous) => [
          createdRequest,
          ...previous.filter((request) => request.id !== createdRequest.id),
        ]);
      }

      setShowReturnDialog(false);
      setSelectedReturnItem(null);

      showResult(
        "success",
        response.data?.message ||
          "Your request has been submitted to the atelier customer care."
      );

      try {
        const historyResponse = await customerApi.get("orders/my-returns/");

        const requests = Array.isArray(historyResponse.data)
          ? historyResponse.data
          : historyResponse.data?.results || [];

        setReturnRequests(
          requests.filter(
            (request) => Number(request.order) === Number(order.id)
          )
        );
      } catch (historyError) {
        console.error("Unable to refresh return history:", historyError);
      }
    } catch (err) {
      console.error("Return/exchange submission error:", err);

      const message = getErrorMessage(err);

      setReturnError(message);
      showResult("error", message);
    } finally {
      setReturnLoading(false);
    }
  };

  // ========================================
  // CANCEL ORDER
  // ========================================

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setCancelLoading(true);

      await customerApi.post(`orders/my-orders/${order.id}/cancel/`);

      setShowCancelDialog(false);

      showResult("success", "Your order has been cancelled successfully.");

      await fetchOrder();
    } catch (err) {
      showResult("error", getErrorMessage(err));
    } finally {
      setCancelLoading(false);
    }
  };

  // ========================================
  // DOWNLOAD INVOICE
  // ========================================

  const handleDownloadInvoice = async () => {
    if (!order) return;

    try {
      setInvoiceLoading(true);

      const response = await customerApi.get(
        `orders/my-orders/${order.id}/invoice/`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;

      link.download = `${storeName}-Invoice-${order.order_number || order.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Invoice download error:", err);

      showResult("error", "Unable to download invoice. Please try again.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  // ========================================
  // FIND RETURN REQUEST FOR ITEM
  // ========================================

  const getRequestForItem = (itemId) =>
    returnRequests.find(
      (request) => Number(request.order_item) === Number(itemId)
    );

  // ========================================
  // ORDER STATUS ICON
  // ========================================

  const getStatusIcon = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "delivered":
        return <CheckCircle2 size={16} aria-hidden="true" />;

      case "cancelled":
        return <XCircle size={16} aria-hidden="true" />;

      case "shipped":
        return <Truck size={16} aria-hidden="true" />;

      case "processing":
      case "confirmed":
        return <Package size={16} aria-hidden="true" />;

      default:
        return <Clock size={16} aria-hidden="true" />;
    }
  };

  // ========================================
  // ORDER TRACKING DATA
  // ========================================

  const orderSteps = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

  const currentStatus = String(order?.status || "").toLowerCase();

  const currentStep = orderSteps.findIndex(
    (step) => step.toLowerCase() === currentStatus
  );

  const estimatedDeliveryDate = order?.estimated_delivery_date;
  const actualDeliveryDate = order?.delivered_at;
  const isDelivered = currentStatus === "delivered";

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="od-page">
        <div className="od-loading" role="status">
          <div className="od-loader" aria-hidden="true" />
          <span className="od-loading-brand">{storeName}</span>
          <p>Unveiling order dossier…</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error || !order) {
    return (
      <div className="od-page">
        <div className="od-error" role="alert">
          <AlertCircle size={36} aria-hidden="true" />

          <h2>Unable to Load Order</h2>

          <p>{error || "Order not found."}</p>

          <Link to="/my-orders" className="od-back-button">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const items = order.items || [];

  const canCancel = ["pending", "confirmed"].includes(currentStatus);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="od-page">
      {/* ───────── Hero with image ───────── */}
      <header className="od-hero">
        {!heroFailed && (
          <img
            className="od-hero__img"
            src="/images/banarasi.jpg"
            alt=""
            width={1600}
            height={600}
            decoding="async"
            onError={() => setHeroFailed(true)}
          />
        )}
        <div className="od-hero__shade" aria-hidden="true" />

        <div className="od-hero__inner">
          <Link to="/my-orders" className="od-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Return to Orders Archive</span>
          </Link>

          <div className="od-header">
            <div>
              <div className="od-eyebrow-container">
                <span className="od-eyebrow-line"></span>
                <p className="od-eyebrow">{storeName.toUpperCase()} · BESPOKE DOSSIER</p>
                <span className="od-eyebrow-line"></span>
              </div>
              <h1>
                Order <em>#{order.order_number || order.id}</em>
              </h1>
              <p className="od-placed">Placed on {formatDate(order.created_at)}</p>
            </div>

            <div className={`od-main-status ${currentStatus}`}>
              {getStatusIcon(order.status)}
              <span>{order.status || "Pending"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="od-container">
        <div className="od-grid">
          {/* ───────── Main column ───────── */}
          <div className="od-main">
            {/* ORDER TRACKING */}
            <section className="od-card" aria-labelledby="od-track-title">
              <div className="od-card-header">
                <h2 id="od-track-title">Atelier Dispatch Journey</h2>
                <span className="od-card-sub">Curated Transit Timeline</span>
              </div>

              {currentStatus === "cancelled" ? (
                <div className="od-cancelled-message" role="status">
                  <XCircle size={22} aria-hidden="true" />
                  <span>This order has been cancelled and closed.</span>
                </div>
              ) : (
                <>
                  <ol className="od-tracking">
                    {orderSteps.map((step, index) => {
                      const done = currentStep > index;
                      const active = currentStep >= index;
                      return (
                        <li
                          className={`od-track-step${active ? " active" : ""}${
                            currentStep === index ? " current" : ""
                          }`}
                          key={step}
                          aria-current={currentStep === index ? "step" : undefined}
                        >
                          <span className="od-track-circle">
                            {done ? (
                              <CheckCircle2 size={16} aria-hidden="true" />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <span className="od-track-label">{step}</span>
                          <span className="od-sr">
                            {done ? " (completed)" : currentStep === index ? " (current)" : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  {estimatedDeliveryDate && !isDelivered && (
                    <div className="od-delivery-info">
                      <div className="od-delivery-icon">
                        <Truck size={20} aria-hidden="true" />
                      </div>

                      <div>
                        <span className="od-delivery-label">Estimated Delivery</span>
                        <strong>{formatDate(estimatedDeliveryDate)}</strong>
                        <p>Your handcrafted saree is in safe transit.</p>
                      </div>
                    </div>
                  )}

                  {isDelivered && (
                    <div className="od-delivery-info od-delivered-info">
                      <div className="od-delivery-icon">
                        <CheckCircle2 size={20} aria-hidden="true" />
                      </div>

                      <div>
                        <span className="od-delivery-label">Delivered with Distinction</span>
                        <strong>
                          {actualDeliveryDate
                            ? formatDate(actualDeliveryDate)
                            : formatDate(order.updated_at)}
                        </strong>
                        <p>This heirloom piece has arrived at your residence.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* PRODUCTS */}
            <section className="od-card" aria-labelledby="od-items-title">
              <div className="od-section-heading">
                <div>
                  <h2 id="od-items-title">Ordered Sarees & Attire</h2>
                  <span className="od-card-sub">Artisanal Weaves in this Consignment</span>
                </div>
                <span className="od-items-count-badge">
                  {items.length} {items.length === 1 ? "Creation" : "Creations"}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="od-no-items">No products found in this order.</p>
              ) : (
                <ul className="od-items">
                  {items.map((item) => {
                    const existingRequest = getRequestForItem(item.id);
                    const imageUrl = getProductImage(item);

                    return (
                      <li className="od-item" key={item.id}>
                        <div className="od-item-image">
                          <Thumb src={imageUrl} alt={item.product_name || "Saree"} />
                        </div>

                        <div className="od-item-info">
                          <span className="od-item-tag">Handcrafted Saree</span>
                          <h3>{item.product_name}</h3>

                          <div className="od-item-specs">
                            <p>Quantity: <strong>{item.quantity}</strong></p>
                            <span className="od-spec-dot">·</span>
                            <p>Unit Price: <strong>{formatPrice(item.price)}</strong></p>
                          </div>

                          {isDelivered && (
                            <div className="od-return-area">
                              {existingRequest ? (
                                <div className="od-return-status">
                                  <div className="od-return-status-top">
                                    <span>{existingRequest.request_type} Request:</span>
                                    <span
                                      className={`od-return-badge ${String(
                                        existingRequest.status
                                      ).toLowerCase()}`}
                                    >
                                      {existingRequest.status}
                                    </span>
                                  </div>

                                  {existingRequest.admin_note && (
                                    <p className="od-admin-note">
                                      Atelier Note: {existingRequest.admin_note}
                                    </p>
                                  )}

                                  <Link to="/my-returns" className="od-view-returns-link">
                                    View Return Details →
                                  </Link>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="od-return-button"
                                  onClick={() => handleOpenReturnDialog(item)}
                                >
                                  <RotateCcw size={14} aria-hidden="true" />
                                  <span>Return or Exchange</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="od-item-price">
                          <span className="od-item-price-label">Subtotal</span>
                          <strong>{formatPrice(item.subtotal)}</strong>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* DELIVERY ADDRESS */}
            <section className="od-card" aria-labelledby="od-addr-title">
              <div className="od-card-header">
                <h2 id="od-addr-title">
                  <MapPin size={18} aria-hidden="true" />
                  Delivery Sanctuary
                </h2>
                <span className="od-card-sub">Destination Address</span>
              </div>

              <address className="od-address">
                <strong>{order.full_name}</strong>
                <p className="od-address-street">{order.address}</p>
                <p className="od-address-region">
                  {order.city}, {order.state} — {order.pincode}
                </p>
                <div className="od-address-contact">
                  <span>Phone: {order.phone}</span>
                  <span className="od-address-sep">·</span>
                  <span>Email: {order.email}</span>
                </div>
              </address>
            </section>
          </div>

          {/* ───────── Summary column ───────── */}
          <aside className="od-side">
            <section className="od-card od-summary" aria-labelledby="od-sum-title">
              <div className="od-card-header">
                <h2 id="od-sum-title">Financial Dossier</h2>
                <span className="od-card-sub">Investment Summary</span>
              </div>

              <div className="od-price-breakdown">
                <div className="od-price-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                <div className="od-price-row">
                  <span>White-Glove Shipping</span>
                  <span>
                    {Number(order.shipping_charge) === 0
                      ? "Complimentary"
                      : formatPrice(order.shipping_charge)}
                  </span>
                </div>

                <div className="od-price-total">
                  <div>
                    <strong>Total Amount</strong>
                    <small>All luxury duties & taxes included</small>
                  </div>
                  <strong className="od-total-number">
                    {formatPrice(order.total_amount)}
                  </strong>
                </div>
              </div>

              <div className="od-pay">
                <h3>
                  <CreditCard size={15} aria-hidden="true" />
                  Payment Information
                </h3>

                <div className="od-payment-row">
                  <span>Method</span>
                  <strong>{order.payment_method === "COD" ? "Cash on Delivery" : order.payment_method || "Online"}</strong>
                </div>

                <div className="od-payment-row">
                  <span>Status</span>
                  <span className={`od-payment-pill ${String(order.payment_status || "pending").toLowerCase()}`}>
                    {order.payment_status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="od-actions">
                <button
                  type="button"
                  className="od-invoice-button"
                  onClick={handleDownloadInvoice}
                  disabled={invoiceLoading}
                >
                  <Download size={16} aria-hidden="true" />
                  <span>{invoiceLoading ? "Generating Invoice…" : "Download Tax Invoice"}</span>
                </button>

                {canCancel && (
                  <button
                    type="button"
                    className="od-cancel-button"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle size={15} aria-hidden="true" />
                    <span>Cancel Consignment</span>
                  </button>
                )}
              </div>
            </section>

            <div className="od-store-signature">
              <span className="od-signature-brand">{storeName.toUpperCase()}</span>
              <p className="od-signature-tagline">{storeTagline}</p>
              <div className="od-signature-line" />
            </div>
          </aside>
        </div>
      </div>

      {/* =========================================================================
          LUXURY RETURN / EXCHANGE MESSAGE BOX & FORM DIALOG
          ========================================================================= */}
      {showReturnDialog && (
        <div
          className="od-modal-overlay"
          onClick={() => {
            if (!returnLoading) {
              setShowReturnDialog(false);
            }
          }}
        >
          <div
            className="od-modal od-luxury-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="od-return-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="od-dialog-glow" />

            <button
              type="button"
              className="od-icon-btn od-dialog-close"
              onClick={() => setShowReturnDialog(false)}
              disabled={returnLoading}
              aria-label="Close dialog"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="od-dialog-emblem">
              <RotateCcw size={26} strokeWidth={1.5} />
            </div>

            <div className="od-modal-header">
              <span className="od-dialog-eyebrow">
                {storeName.toUpperCase()} CONCIERGE CARE
              </span>
              <h2 id="od-return-title">Return or Exchange Request</h2>
              <p className="od-dialog-sub">
                We take immense pride in our artisanal weaves. Should your piece fall short of perfection,
                our client atelier is here to assist.
              </p>
            </div>

            <div className="od-modal-product">
              <span className="od-product-label">SELECTED WEAVE:</span>
              <strong className="od-product-val">{selectedReturnItem?.product_name}</strong>
            </div>

            <form onSubmit={handleReturnSubmit} noValidate>
              <div className="od-return-field">
                <label htmlFor="od-rtype">Request Type</label>
                <div className="od-select-wrap">
                  <select
                    id="od-rtype"
                    value={returnType}
                    onChange={(event) => setReturnType(event.target.value)}
                    required
                  >
                    <option value="Return">Return for Full Refund</option>
                    <option value="Exchange">Exchange for Replacement Weave</option>
                  </select>
                  <ChevronDown size={16} className="od-select-arrow" />
                </div>
              </div>

              <div className="od-return-field">
                <label htmlFor="od-rreason">Primary Reason</label>
                <div className="od-select-wrap">
                  <select
                    id="od-rreason"
                    value={returnReason}
                    onChange={(event) => setReturnReason(event.target.value)}
                    required
                  >
                    {RETURN_REASONS.map((reason) => (
                      <option value={reason} key={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="od-select-arrow" />
                </div>
              </div>

              <div className="od-return-field">
                <label htmlFor="od-rdesc">Artisan Note / Description</label>
                <textarea
                  id="od-rdesc"
                  rows="3"
                  value={returnDescription}
                  onChange={(event) => setReturnDescription(event.target.value)}
                  placeholder="Kindly describe any defects, weave variations, or notes for our inspection team…"
                />
              </div>

              {returnError && (
                <div className="od-form-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{returnError}</span>
                </div>
              )}

              <div className="od-dialog-divider">
                <span className="od-div-line" />
                <span className="od-div-gem">✦</span>
                <span className="od-div-line" />
              </div>

              <div className="od-modal-actions">
                <button
                  type="button"
                  className="od-modal-cancel"
                  onClick={() => setShowReturnDialog(false)}
                  disabled={returnLoading}
                >
                  Discard
                </button>

                <button type="submit" className="od-modal-submit" disabled={returnLoading}>
                  {returnLoading ? (
                    <span>Submitting Request…</span>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Submit Atelier Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          LUXURY CANCEL ORDER CONFIRMATION MESSAGE BOX
          ========================================================================= */}
      {showCancelDialog && (
        <div
          className="od-modal-overlay"
          onClick={() => {
            if (!cancelLoading) {
              setShowCancelDialog(false);
            }
          }}
        >
          <div
            className="od-modal od-luxury-dialog od-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="od-cancel-title"
            aria-describedby="od-cancel-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="od-dialog-glow warning" />

            <button
              type="button"
              className="od-icon-btn od-dialog-close"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelLoading}
              aria-label="Close confirmation dialog"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="od-confirm-icon-wrap">
              <div className="od-confirm-icon">
                <AlertCircle size={32} aria-hidden="true" />
              </div>
            </div>

            <span className="od-dialog-eyebrow">
              {storeName.toUpperCase()} CONSIGNMENT CANCELLATION
            </span>

            <h2 id="od-cancel-title">Cancel this Consignment?</h2>

            <p id="od-cancel-desc">
              Are you certain you wish to revoke this order? The bespoke reservation for your
              handcrafted saree will be immediately released back to our boutique archive.
            </p>

            <div className="od-dialog-divider">
              <span className="od-div-line" />
              <span className="od-div-gem">✦</span>
              <span className="od-div-line" />
            </div>

            <div className="od-modal-actions">
              <button
                type="button"
                className="od-modal-cancel"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelLoading}
                autoFocus
              >
                Keep My Order
              </button>

              <button
                type="button"
                className="od-modal-submit od-danger-submit"
                onClick={handleCancelOrder}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Revoking…" : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LUXURY RESULT POPUP (SUCCESS & ERROR)
          ========================================================================= */}
      {showResultModal && (
        <div className="od-modal-overlay" onClick={() => setShowResultModal(false)}>
          <div
            className="od-modal od-luxury-dialog od-result-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="od-result-title"
            aria-describedby="od-result-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`od-dialog-glow ${resultModalType}`} />

            <button
              type="button"
              className="od-icon-btn od-dialog-close"
              onClick={() => setShowResultModal(false)}
              aria-label="Close notice"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="od-result-icon-ring">
              <div
                className={`od-result-icon ${
                  resultModalType === "success" ? "success" : "error"
                }`}
              >
                {resultModalType === "success" ? (
                  <CheckCircle2 size={34} aria-hidden="true" />
                ) : (
                  <AlertCircle size={34} aria-hidden="true" />
                )}
              </div>
            </div>

            <span className="od-dialog-eyebrow">
              {storeName.toUpperCase()} NOTIFICATION
            </span>

            <h2 id="od-result-title">
              {resultModalType === "success"
                ? "Request Received With Honor"
                : "Notice from the Atelier"}
            </h2>

            <p id="od-result-desc">{resultModalMessage}</p>

            <div className="od-dialog-divider">
              <span className="od-div-line" />
              <span className="od-div-gem">✦</span>
              <span className="od-div-line" />
            </div>

            <button
              type="button"
              className="od-result-button"
              onClick={() => setShowResultModal(false)}
              autoFocus
            >
              Gracefully Acknowledged
            </button>

            <small className="od-result-tagline">{storeTagline}</small>
          </div>
        </div>
      )}
    </div>
  );
}