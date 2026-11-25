import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  Package,
  ShoppingBag,
  ArrowRight,
  CalendarDays,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RefreshCw,
  Search,
  Heart,
  ClipboardList,
  FileText,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import useStoreSettings from "../../hooks/useStoreSettings";
import "./MyOrders.css";

// ------------------------------------
// PRICE FORMAT
// ------------------------------------

const formatPrice = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

// ------------------------------------
// DATE FORMAT
// ------------------------------------

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ------------------------------------
// STATUS HELPERS
// ------------------------------------

const normalizeStatus = (status) => {
  return String(status || "Pending").trim().toLowerCase();
};

const getStatusClass = (status) => {
  const value = normalizeStatus(status);

  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return allowedStatuses.includes(value) ? value : "pending";
};

const getStatusIcon = (status) => {
  const value = normalizeStatus(status);

  switch (value) {
    case "delivered":
      return CheckCircle2;

    case "shipped":
      return Truck;

    case "cancelled":
      return XCircle;

    case "processing":
      return Package;

    case "confirmed":
      return CheckCircle2;

    default:
      return Clock;
  }
};

// ------------------------------------
// GET ORDER LIST
// ------------------------------------

const getOrderList = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) return data.results;

  if (Array.isArray(data?.orders)) return data.orders;

  return [];
};

// ------------------------------------
// MY ORDERS COMPONENT
// ------------------------------------

export default function MyOrders() {
  const navigate = useNavigate();

  // Dynamic Store Settings
  const { settings } = useStoreSettings();

  const storeName = settings?.store_name || "SĀRIKA";

  const storeTagline =
    settings?.tagline || "Tradition, wrapped with love";

  // Order States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Search and Filter
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Invoice States
  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);
  const [invoiceErrors, setInvoiceErrors] = useState({});

  // ------------------------------------
  // FETCH CUSTOMER ORDERS
  // ------------------------------------

  const fetchOrders = useCallback(
    async (showRefresh = false) => {
      const token = localStorage.getItem("customer_access");

      if (!token) {
        navigate("/customer/login");
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await customerApi.get("orders/my-orders/");

        setOrders(getOrderList(response.data));
      } catch (err) {
        console.error("My orders error:", err);

        if (err.response?.status === 401) {
          navigate("/customer/login");
          return;
        }

        setError(
          err.response?.data?.detail ||
            "We couldn't load your orders. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ------------------------------------
  // DOWNLOAD INVOICE PDF
  // ------------------------------------

  const handleDownloadInvoice = async (order) => {
    if (invoiceLoadingId !== null) return;

    try {
      setInvoiceLoadingId(order.id);

      setInvoiceErrors((previous) => ({
        ...previous,
        [order.id]: "",
      }));

      const response = await customerApi.get(
        `orders/my-orders/${order.id}/invoice/`,
        {
          responseType: "blob",
        }
      );

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const fileUrl = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = fileUrl;

      link.download = `${storeName}-Invoice-${
        order.order_number || order.id
      }.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Invoice download error:", err);

      setInvoiceErrors((previous) => ({
        ...previous,
        [order.id]:
          "Unable to download invoice. Please try again.",
      }));
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  // ------------------------------------
  // SEARCH AND FILTER
  // ------------------------------------

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderNumber = String(
        order.order_number || order.id || ""
      ).toLowerCase();

      const status = normalizeStatus(order.status);

      const matchesSearch =
        orderNumber.includes(searchValue) ||
        status.includes(searchValue);

      const matchesFilter =
        activeFilter === "All" ||
        status === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, activeFilter]);

  // ------------------------------------
  // ORDER STATISTICS
  // ------------------------------------

  const stats = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter((order) =>
        ["pending", "confirmed"].includes(
          normalizeStatus(order.status)
        )
      ).length,

      processing: orders.filter((order) =>
        ["processing", "shipped"].includes(
          normalizeStatus(order.status)
        )
      ).length,

      delivered: orders.filter(
        (order) =>
          normalizeStatus(order.status) === "delivered"
      ).length,
    };
  }, [orders]);

  const filters = [
    "All",
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  // ------------------------------------
  // LOADING SCREEN
  // ------------------------------------

  if (loading) {
    return (
      <div className="mo2-loading">
        <div className="mo2-loading-box">
          <div className="mo2-loader"></div>
          <span className="mo2-loading-brand">{storeName}</span>
          <p>Gathering your cherished saree orders...</p>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // MAIN UI
  // ------------------------------------

  return (
    <main className="mo2-page">
      <div className="mo2-container">

        {/* BREADCRUMB */}
        <nav className="mo2-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="mo2-breadcrumb-sep">/</span>
          <span className="mo2-breadcrumb-current">My Orders Archive</span>
        </nav>

        {/* HERO SECTION */}
        <section className="mo2-hero">
          <div className="mo2-hero-content">
            <div className="mo2-eyebrow-wrap">
              <span className="mo2-eyebrow-line"></span>
              <p className="mo2-eyebrow">
                {storeName.toUpperCase()} · CLIENT ARCHIVE & ORDERS
              </p>
              <span className="mo2-eyebrow-line"></span>
            </div>

            <h1>
              Every order tells
              <br />
              <span>a timeless heirloom story.</span>
            </h1>

            <p className="mo2-hero-description">
              Follow the journey of your handcrafted weaves from our master artisans' looms
              straight to your wardrobe sanctuary.
            </p>

            <Link to="/shop" className="mo2-shop-link">
              <span>Explore Collection</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mo2-hero-art">
            <div className="mo2-art-ring">
              <div className="mo2-art-circle">
                <ShoppingBag size={54} strokeWidth={1.2} />
              </div>
            </div>

            <span className="mo2-art-label">
              YOUR {storeName.toUpperCase()} ARCHIVE
            </span>

            <small className="mo2-art-tagline">{storeTagline}</small>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="mo2-stats" aria-label="Order summary statistics">
          <div className="mo2-stat">
            <div className="mo2-stat-icon">
              <ClipboardList size={22} />
            </div>
            <div className="mo2-stat-text">
              <strong>{stats.total}</strong>
              <span>Total Orders</span>
            </div>
          </div>

          <div className="mo2-stat">
            <div className="mo2-stat-icon awaiting">
              <Clock size={22} />
            </div>
            <div className="mo2-stat-text">
              <strong>{stats.pending}</strong>
              <span>Awaiting</span>
            </div>
          </div>

          <div className="mo2-stat">
            <div className="mo2-stat-icon shipping">
              <Truck size={22} />
            </div>
            <div className="mo2-stat-text">
              <strong>{stats.processing}</strong>
              <span>In Transit</span>
            </div>
          </div>

          <div className="mo2-stat">
            <div className="mo2-stat-icon delivered">
              <CheckCircle2 size={22} />
            </div>
            <div className="mo2-stat-text">
              <strong>{stats.delivered}</strong>
              <span>Delivered</span>
            </div>
          </div>
        </section>

        {/* ORDERS SECTION */}
        <section className="mo2-orders-section">

          {/* SECTION HEADING */}
          <div className="mo2-section-heading">
            <div>
              <p className="mo2-section-label">
                CURATED PURCHASE HISTORY
              </p>

              <h2>Client Dispatches</h2>

              <p className="mo2-section-desc">
                All your bespoke {storeName} acquisitions, beautifully cataloged.
              </p>
            </div>

            <button
              type="button"
              className="mo2-refresh"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              aria-label="Refresh orders"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "mo2-spin" : ""}
              />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="mo2-toolbar">
            <div className="mo2-search">
              <Search size={17} className="mo2-search-icon" />

              <input
                type="text"
                placeholder="Search by order # or status (e.g. Delivered)..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className="mo2-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* STATUS FILTERS */}
          <div className="mo2-filters" role="tablist">
            {filters.map((filter) => (
              <button
                type="button"
                key={filter}
                className={
                  activeFilter === filter ? "active" : ""
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mo2-error" role="alert">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => fetchOrders(true)}
                disabled={refreshing}
              >
                {refreshing ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}

          {/* ORDERS LIST */}
          {!error && filteredOrders.length > 0 && (
            <div className="mo2-order-list">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);

                const itemCount = (order.items || []).reduce(
                  (total, item) =>
                    total + Number(item.quantity || 0),
                  0
                );

                const statusClass = getStatusClass(order.status);

                const normalizedStatus = normalizeStatus(
                  order.status
                );

                const isDelivered =
                  normalizedStatus === "delivered";

                const isCancelled =
                  normalizedStatus === "cancelled";

                const estimatedDeliveryDate =
                  order.estimated_delivery_date;

                const actualDeliveryDate =
                  order.delivered_at;

                const isDownloading =
                  invoiceLoadingId === order.id;

                return (
                  <article
                    className={`mo2-order-card status-${statusClass}`}
                    key={order.id}
                  >
                    {/* ORDER HEADER */}
                    <div className="mo2-order-top">
                      <div className="mo2-order-number">
                        <div className="mo2-order-icon">
                          <Package size={20} />
                        </div>

                        <div>
                          <span>ORDER IDENTIFIER</span>
                          <strong>
                            #{order.order_number || order.id}
                          </strong>
                        </div>
                      </div>

                      <span
                        className={`mo2-status ${statusClass}`}
                      >
                        <StatusIcon size={14} />
                        <span>{order.status || "Pending"}</span>
                      </span>
                    </div>

                    {/* ORDER INFORMATION GRID */}
                    <div className="mo2-order-details">
                      <div className="mo2-order-date">
                        <CalendarDays size={16} />
                        <div>
                          <span>PLACED ON</span>
                          <strong>
                            {formatDate(order.created_at)}
                          </strong>
                        </div>
                      </div>

                      <div className="mo2-order-items">
                        <ShoppingBag size={16} />
                        <div>
                          <span>CURATED ITEMS</span>
                          <strong>
                            {itemCount}{" "}
                            {itemCount === 1 ? "Saree" : "Sarees"}
                          </strong>
                        </div>
                      </div>

                      <div className="mo2-order-payment">
                        <span>PAYMENT METHOD</span>
                        <strong>
                          {order.payment_method === "COD"
                            ? "Cash on Delivery"
                            : order.payment_method || "Online Payment"}
                        </strong>
                        <small className="mo2-payment-status">
                          {order.payment_status || "Pending"}
                        </small>
                      </div>

                      <div className="mo2-order-total">
                        <span>TOTAL INVESTMENT</span>
                        <strong className="mo2-total-price">
                          {formatPrice(order.total_amount)}
                        </strong>
                      </div>
                    </div>

                    {/* DELIVERY INFORMATION BANNER */}
                    {!isCancelled && (
                      <div className="mo2-delivery-info">
                        {isDelivered ? (
                          <div className="mo2-delivery-content mo2-delivered-info">
                            <div className="mo2-delivery-icon">
                              <CheckCircle2 size={18} />
                            </div>

                            <div>
                              <span className="mo2-delivery-label">
                                ATELIER DISPATCH STATUS
                              </span>
                              <strong>
                                Your exquisite weave has been safely delivered!
                              </strong>
                              {actualDeliveryDate && (
                                <small>
                                  Received on{" "}
                                  {formatDate(actualDeliveryDate)}
                                </small>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mo2-delivery-content">
                            <div className="mo2-delivery-icon">
                              <Truck size={18} />
                            </div>

                            <div>
                              <span className="mo2-delivery-label">
                                ESTIMATED SAFE PASSAGE
                              </span>
                              <strong>
                                {estimatedDeliveryDate
                                  ? formatDate(estimatedDeliveryDate)
                                  : "Transit schedule being arranged"}
                              </strong>
                              <small>
                                {estimatedDeliveryDate
                                  ? "Handcrafted packaging ensures flawless arrival."
                                  : "Our logistics concierge will update tracking shortly."}
                              </small>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ORDER FOOTER ACTIONS */}
                    <div className="mo2-order-footer">
                      <div className="mo2-thankyou">
                        <Heart size={14} />
                        <span>
                          Pure artisanal handlooms crafted for your grace.
                        </span>
                      </div>

                      <div className="mo2-order-actions">
                        <button
                          type="button"
                          className="mo2-invoice-btn"
                          onClick={() =>
                            handleDownloadInvoice(order)
                          }
                          disabled={invoiceLoadingId !== null}
                          title="Download Tax Invoice PDF"
                        >
                          <FileText size={15} />
                          <span>
                            {isDownloading
                              ? "Preparing PDF..."
                              : "Download Invoice"}
                          </span>
                        </button>

                        <Link
                          to={`/my-orders/${order.id}`}
                          className="mo2-view-btn"
                        >
                          <span>View Order</span>
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>

                    {/* INVOICE ERROR NOTICE */}
                    {invoiceErrors[order.id] && (
                      <p className="mo2-invoice-error" role="alert">
                        {invoiceErrors[order.id]}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* NO MATCHING SEARCH/FILTER ORDERS */}
          {!error &&
            orders.length > 0 &&
            filteredOrders.length === 0 && (
              <div className="mo2-empty">
                <div className="mo2-empty-icon">
                  <Search size={32} strokeWidth={1.3} />
                </div>

                <h3>No Matching Orders Found</h3>

                <p>
                  No orders match your current query "{search}" or filter selection.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("All");
                  }}
                >
                  Reset Search & Filters
                </button>
              </div>
            )}

          {/* NO ORDERS PLACED YET */}
          {!error && orders.length === 0 && (
            <div className="mo2-empty">
              <div className="mo2-empty-icon">
                <ShoppingBag size={36} strokeWidth={1.2} />
              </div>

              <p className="mo2-section-label">
                A NEW CHAPTER AWAITS
              </p>

              <h3>Your collection starts here</h3>

              <p>
                You haven't placed an order yet. Uncover authentic Banarasi, Kanjivaram,
                and Chanderi sarees woven for the discerning connoisseur.
              </p>

              <Link
                to="/shop"
                className="mo2-empty-btn"
              >
                <span>Explore {storeName} Weaves</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

        </section>

        {/* BOTTOM BRAND FOOTNOTE */}
        <footer className="mo2-footer">
          <div className="mo2-footer-line"></div>

          <p>
            Thank you for making {storeName} a cherished part of your celebrations.
          </p>

          <span>
            WHERE TRADITION MEETS TIMELESS ELEGANCE
          </span>
        </footer>

      </div>
    </main>
  );
}