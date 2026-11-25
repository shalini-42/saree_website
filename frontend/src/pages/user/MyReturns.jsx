import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  X,
  CalendarDays,
  ShoppingBag,
  FileText,
  Eye,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import useStoreSettings from "../../hooks/useStoreSettings";
import "./MyReturns.css";

const BACKEND_URL = "http://127.0.0.1:8000";

// ========================================
// IMAGE URL HELPER
// ========================================
function getImageUrl(item) {
  const image =
    item?.product_image ||
    item?.image ||
    item?.thumbnail ||
    item?.product?.thumbnail ||
    item?.product?.image ||
    "";

  if (!image) return "";

  if (typeof image === "object") {
    const imageValue = image.url || image.image || "";
    if (!imageValue) return "";
    return imageValue.startsWith("http")
      ? imageValue
      : `${BACKEND_URL}${imageValue.startsWith("/") ? "" : "/"}${imageValue}`;
  }

  return image.startsWith("http")
    ? image
    : `${BACKEND_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

// ========================================
// STATUS BADGE CONFIG
// ========================================
function getStatusMeta(status) {
  const normalized = String(status || "").toLowerCase().trim();
  switch (normalized) {
    case "approved":
      return {
        label: "Approved",
        icon: <CheckCircle2 size={15} />,
        className: "status-approved",
        description: "Request authorized by concierge",
      };
    case "completed":
      return {
        label: "Completed",
        icon: <CheckCircle2 size={15} />,
        className: "status-completed",
        description: "Process finalized & closed",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: <XCircle size={15} />,
        className: "status-rejected",
        description: "Request declined after assessment",
      };
    case "in_review":
    case "in review":
    case "processing":
      return {
        label: "In Review",
        icon: <Clock size={15} />,
        className: "status-processing",
        description: "Under inspection at atelier",
      };
    default:
      return {
        label: status || "Pending",
        icon: <Clock size={15} />,
        className: "status-pending",
        description: "Awaiting concierge evaluation",
      };
  }
}

// ========================================
// DATE FORMATTING
// ========================================
function formatDate(date) {
  if (!date) return "Date unavailable";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }
  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function MyReturns() {
  const navigate = useNavigate();

  // Dynamic Store Settings
  const { settings } = useStoreSettings();
  const storeName = settings?.store_name || "SĀRIKA";
  const storeTagline = settings?.tagline || "The Art of Elegance";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // View details modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ========================================
  // LOAD RETURN REQUESTS
  // ========================================
  const loadRequests = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await customerApi.get("orders/my-returns/");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.requests)
        ? data.requests
        : [];

      setRequests(list);
    } catch (err) {
      console.error("Unable to load return requests:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load your return requests. Please try again."
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedRequest) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedRequest]);

  // ========================================
  // FILTERS CONFIG
  // ========================================
  const filters = [
    "All",
    "Pending",
    "Approved",
    "Rejected",
    "Completed",
  ];

  // ========================================
  // SEARCH & FILTERED LIST
  // ========================================
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const statusMatch =
        activeFilter === "All" ||
        String(request.status || "").toLowerCase() ===
          activeFilter.toLowerCase();

      const searchText = [
        request.id,
        request.order_number,
        request.order?.order_number,
        request.order,
        request.product_name,
        request.order_item_details?.product_name,
        request.order_item_info?.product_name,
        request.reason,
        request.request_type,
        request.description,
        request.admin_note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        statusMatch &&
        searchText.includes(search.toLowerCase().trim())
      );
    });
  }, [requests, activeFilter, search]);

  // ========================================
  // STATUS COUNTS
  // ========================================
  const counts = useMemo(() => {
    return {
      All: requests.length,
      Pending: requests.filter(
        (r) => String(r.status || "").toLowerCase() === "pending"
      ).length,
      Approved: requests.filter(
        (r) => String(r.status || "").toLowerCase() === "approved"
      ).length,
      Rejected: requests.filter(
        (r) => String(r.status || "").toLowerCase() === "rejected"
      ).length,
      Completed: requests.filter(
        (r) => String(r.status || "").toLowerCase() === "completed"
      ).length,
    };
  }, [requests]);

  // ========================================
  // MODAL HANDLERS
  // ========================================
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  // Selected request helpers
  const selectedItem =
    selectedRequest?.order_item_details ||
    selectedRequest?.order_item_info ||
    selectedRequest;

  const selectedImage = selectedItem ? getImageUrl(selectedItem) : "";

  const selectedProductName =
    selectedRequest?.product_name ||
    selectedItem?.product_name ||
    `${storeName} Handloom Saree`;

  const selectedOrderNumber =
    selectedRequest?.order_number ||
    selectedRequest?.order?.order_number ||
    selectedRequest?.order ||
    "—";

  const selectedStatusMeta = getStatusMeta(selectedRequest?.status);

  // ========================================
  // RENDER
  // ========================================
  return (
    <main className="mr-page">
      <div className="mr-container">

        {/* BREADCRUMB & BACK LINK */}
        <nav className="mr-breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="mr-breadcrumb-link">
            Home
          </Link>
          <span className="mr-breadcrumb-separator">/</span>
          <Link to="/profile" className="mr-breadcrumb-link">
            My Account
          </Link>
          <span className="mr-breadcrumb-separator">/</span>
          <span className="mr-breadcrumb-current">Returns & Exchanges</span>
        </nav>

        {/* CINEMATIC EDITORIAL HERO */}
        <header className="mr-header">
          <div className="mr-header-content">
            <div className="mr-crest-badge">
              <span className="mr-crest-star">✦</span>
              <span className="mr-eyebrow">
                {storeName.toUpperCase()} · CONCIERGE CARE
              </span>
              <span className="mr-crest-star">✦</span>
            </div>

            <h1 className="mr-title">Returns & Exchanges</h1>

            <p className="mr-subtitle">
              Cherishing the artistry of your drape. Monitor your return evaluations,
              boutique exchange requests, and concierge resolutions in one refined place.
            </p>
          </div>

          <div className="mr-header-actions">
            <button
              type="button"
              className={`mr-refresh-btn ${isRefreshing ? "spinning" : ""}`}
              onClick={() => loadRequests(true)}
              disabled={loading || isRefreshing}
              title="Refresh requests"
              aria-label="Refresh requests"
            >
              <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
              <span>Refresh Care Log</span>
            </button>
          </div>
        </header>

        {/* STATUS SUMMARY METRICS CARDS */}
        <section className="mr-summary" aria-label="Returns summary">
          <div
            className={`mr-summary-card ${activeFilter === "All" ? "active-summary" : ""}`}
            onClick={() => setActiveFilter("All")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveFilter("All")}
          >
            <div className="mr-summary-decor">01</div>
            <span className="mr-summary-label">Total Requests</span>
            <strong className="mr-summary-value">{counts.All}</strong>
            <small className="mr-summary-hint">Archived inquiries</small>
          </div>

          <div
            className={`mr-summary-card pending ${activeFilter === "Pending" ? "active-summary" : ""}`}
            onClick={() => setActiveFilter("Pending")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveFilter("Pending")}
          >
            <div className="mr-summary-decor">02</div>
            <span className="mr-summary-label">Pending Review</span>
            <strong className="mr-summary-value">{counts.Pending}</strong>
            <small className="mr-summary-hint">Awaiting inspection</small>
          </div>

          <div
            className={`mr-summary-card approved ${activeFilter === "Approved" ? "active-summary" : ""}`}
            onClick={() => setActiveFilter("Approved")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveFilter("Approved")}
          >
            <div className="mr-summary-decor">03</div>
            <span className="mr-summary-label">Approved</span>
            <strong className="mr-summary-value">{counts.Approved}</strong>
            <small className="mr-summary-hint">Authorized for transit</small>
          </div>

          <div
            className={`mr-summary-card completed ${activeFilter === "Completed" ? "active-summary" : ""}`}
            onClick={() => setActiveFilter("Completed")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveFilter("Completed")}
          >
            <div className="mr-summary-decor">04</div>
            <span className="mr-summary-label">Completed</span>
            <strong className="mr-summary-value">{counts.Completed}</strong>
            <small className="mr-summary-hint">Resolved & settled</small>
          </div>
        </section>

        {/* CONTROLS TOOLBAR: FILTERS + LUXURY SEARCH */}
        <section className="mr-toolbar" aria-label="Filter and search requests">
          <div className="mr-filters" role="tablist">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter}
                className={`mr-filter-pill ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                <span className="mr-filter-name">{filter}</span>
                <span className="mr-filter-count">{counts[filter] || 0}</span>
              </button>
            ))}
          </div>

          <div className="mr-search-wrapper">
            <div className="mr-search">
              <Search size={17} className="mr-search-icon" />
              <input
                type="text"
                placeholder="Search by order #, saree, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search return requests"
              />
              {search && (
                <button
                  type="button"
                  className="mr-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* MAIN FEED CONTENT */}
        {loading ? (
          <div className="mr-message mr-loading-state">
            <div className="mr-orbital-loader">
              <div className="mr-orbital-ring"></div>
              <div className="mr-orbital-core">
                <Sparkles size={18} className="mr-sparkle-icon" />
              </div>
            </div>
            <h2>Consulting SĀRIKA Archives</h2>
            <p>Retaining your bespoke care history and concierge notes...</p>
          </div>
        ) : error ? (
          <div className="mr-message mr-error">
            <div className="mr-error-icon-box">
              <AlertCircle size={32} />
            </div>
            <h2>Unable to Connect to Archive</h2>
            <p>{error}</p>
            <button
              type="button"
              className="mr-retry-btn"
              onClick={() => loadRequests()}
            >
              <RefreshCw size={15} />
              Re-establish Connection
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-icon-wrap">
              <Package size={36} />
              <div className="mr-empty-glow" />
            </div>
            <h3>
              {requests.length === 0
                ? "Your Collection Rests In Perfection"
                : "No Dossiers Match Your Selection"}
            </h3>
            <p>
              {requests.length === 0
                ? `You have not submitted any return or exchange requests. All drapes from ${storeName} remain in your cherished collection.`
                : "We could not find any return requests matching your current status filter or keyword search."}
            </p>
            {requests.length === 0 ? (
              <Link to="/shop" className="mr-empty-cta">
                <span>Explore SĀRIKA Creations</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <button
                type="button"
                className="mr-empty-reset"
                onClick={() => {
                  setActiveFilter("All");
                  setSearch("");
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="mr-list">
            {filteredRequests.map((request) => {
              const itemDetails =
                request.order_item_details ||
                request.order_item_info ||
                {};

              const image =
                getImageUrl(itemDetails) ||
                getImageUrl(request);

              const status = request.status || "Pending";
              const statusMeta = getStatusMeta(status);

              const productName =
                request.product_name ||
                itemDetails.product_name ||
                `${storeName} Handloom Saree`;

              const orderNumber =
                request.order_number ||
                request.order?.order_number ||
                request.order ||
                "—";

              const isExchange =
                String(request.request_type || "").toLowerCase() === "exchange";

              return (
                <article className="mr-card" key={request.id}>
                  {/* CARD ORNAMENTATION */}
                  <div className="mr-card-filigree top-left"></div>
                  <div className="mr-card-filigree top-right"></div>

                  {/* LEFT: SAREE PORTRAIT THUMBNAIL */}
                  <div className="mr-card-media">
                    <div className="mr-image-frame">
                      {image ? (
                        <img
                          src={image}
                          alt={productName}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="mr-image-fallback"
                        style={{ display: image ? "none" : "flex" }}
                      >
                        <ShoppingBag size={28} />
                        <span>SĀRIKA</span>
                      </div>
                      <div className="mr-type-tag">
                        {isExchange ? "Exchange" : "Return"}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: DOSSIER CONTENT */}
                  <div className="mr-card-body">
                    {/* TOP META ROW */}
                    <div className="mr-card-top">
                      <div className="mr-card-identifiers">
                        <span className="mr-request-label">
                          DOSSIER #{request.id}
                        </span>
                        <span className="mr-request-bullet">·</span>
                        <span className="mr-order-ref">
                          ORDER {orderNumber}
                        </span>
                      </div>

                      <div className={`mr-status ${statusMeta.className}`}>
                        <span className="mr-status-dot"></span>
                        {statusMeta.icon}
                        <span className="mr-status-text">{statusMeta.label}</span>
                      </div>
                    </div>

                    {/* TITLE */}
                    <h3 className="mr-product-title">{productName}</h3>

                    {/* META GRID */}
                    <div className="mr-meta-grid">
                      <div className="mr-meta-item">
                        <span className="mr-meta-label">Classification</span>
                        <strong className="mr-meta-val">
                          {request.request_type || "Bespoke Return"}
                        </strong>
                      </div>

                      <div className="mr-meta-item">
                        <span className="mr-meta-label">Primary Reason</span>
                        <strong className="mr-meta-val">
                          {request.reason || "Couture Consultation"}
                        </strong>
                      </div>

                      <div className="mr-meta-item">
                        <span className="mr-meta-label">Lodged On</span>
                        <strong className="mr-meta-val">
                          <CalendarDays size={13} className="mr-inline-icon" />
                          {formatDate(request.requested_at)}
                        </strong>
                      </div>
                    </div>

                    {/* CUSTOMER DESCRIPTION SNIPPET */}
                    {request.description && (
                      <div className="mr-description">
                        <span className="mr-description-label">Client Notes:</span>
                        <p className="mr-description-text">
                          “{request.description}”
                        </p>
                      </div>
                    )}

                    {/* ATELIER ADMIN RESPONSE PREVIEW */}
                    {request.admin_note ? (
                      <div className="mr-admin-banner">
                        <div className="mr-admin-banner-tag">
                          <ShieldCheck size={14} />
                          <span>Atelier Feedback</span>
                        </div>
                        <p className="mr-admin-banner-text">
                          {request.admin_note}
                        </p>
                      </div>
                    ) : null}

                    {/* CARD FOOTER WITH ACTION BUTTON */}
                    <div className="mr-card-footer">
                      <div className="mr-card-dates">
                        <span>Latest Update:</span>
                        <strong>{formatDate(request.updated_at || request.requested_at)}</strong>
                      </div>

                      <div className="mr-card-actions">
                        <button
                          type="button"
                          className="mr-view-details"
                          onClick={() => handleViewDetails(request)}
                          aria-label={`View dossier details for request ${request.id}`}
                        >
                          <Eye size={15} />
                          <span>View Full Dossier</span>
                          <ChevronRight size={14} className="mr-btn-arrow" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* BOUTIQUE ATELIER SIGNATURE */}
        <footer className="mr-store-signature">
          <div className="mr-signature-crest">
            <span className="mr-signature-line" />
            <span className="mr-signature-symbol">✦ SĀRIKA ✦</span>
            <span className="mr-signature-line" />
          </div>
          <p className="mr-signature-title">{storeName.toUpperCase()}</p>
          <small className="mr-signature-tagline">{storeTagline}</small>
          <p className="mr-signature-care">
            For bespoke concierge guidance regarding your drape exchanges, contact our private client suite at care@sarika.com
          </p>
        </footer>

      </div>

      {/* =====================================
          HAUTE COUTURE DETAILS DIALOG MODAL
      ===================================== */}
      {selectedRequest && (
        <div
          className="mr-modal-overlay"
          onClick={handleCloseDetails}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mr-modal-title"
        >
          <div
            className="mr-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* CORNER ORNAMENTS */}
            <div className="mr-modal-corner tl"></div>
            <div className="mr-modal-corner tr"></div>
            <div className="mr-modal-corner bl"></div>
            <div className="mr-modal-corner br"></div>

            {/* MODAL HEADER */}
            <div className="mr-modal-header">
              <div className="mr-modal-header-text">
                <span className="mr-modal-eyebrow">
                  {storeName.toUpperCase()} · CLIENT CARE DOSSIER
                </span>
                <h2 id="mr-modal-title" className="mr-modal-heading">
                  Request Dossier #{selectedRequest.id}
                </h2>
                <div className="mr-modal-divider">
                  <span>✦</span>
                </div>
              </div>

              <button
                type="button"
                className="mr-modal-close"
                onClick={handleCloseDetails}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="mr-modal-body">
              {/* STATUS BANNER */}
              <div className="mr-details-status-card">
                <div className="mr-status-info">
                  <span className="mr-status-pretitle">Investigation Status</span>
                  <div className={`mr-status ${selectedStatusMeta.className}`}>
                    <span className="mr-status-dot"></span>
                    {selectedStatusMeta.icon}
                    <span className="mr-status-text">{selectedStatusMeta.label}</span>
                  </div>
                </div>
                <p className="mr-status-desc">
                  {selectedStatusMeta.description}
                </p>
              </div>

              {/* PRODUCT PRESENTATION CARD */}
              <div className="mr-details-product">
                <div className="mr-details-product-thumb">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={selectedProductName}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="mr-details-product-fallback">
                      <ShoppingBag size={28} />
                    </div>
                  )}
                  <span className="mr-details-type-badge">
                    {selectedRequest.request_type || "Return"}
                  </span>
                </div>

                <div className="mr-details-product-info">
                  <span className="mr-product-order-pill">
                    ORDER #{selectedOrderNumber}
                  </span>
                  <h3 className="mr-details-product-name">{selectedProductName}</h3>
                  <p className="mr-details-product-note">
                    Authentic Handloom Silk · Handcrafted by SĀRIKA Weavers
                  </p>
                </div>
              </div>

              {/* ATTRIBUTES DOSSIER GRID */}
              <div className="mr-details-section">
                <h4 className="mr-section-title">
                  <FileText size={15} />
                  <span>Dossier Particulars</span>
                </h4>

                <div className="mr-details-grid">
                  <div className="mr-details-row">
                    <span className="mr-row-label">Request Type</span>
                    <strong className="mr-row-value">
                      {selectedRequest.request_type || "Return"}
                    </strong>
                  </div>

                  <div className="mr-details-row">
                    <span className="mr-row-label">Stated Reason</span>
                    <strong className="mr-row-value">
                      {selectedRequest.reason || "Couture Assessment"}
                    </strong>
                  </div>

                  <div className="mr-details-row">
                    <span className="mr-row-label">Submission Date</span>
                    <strong className="mr-row-value">
                      <CalendarDays size={13} className="mr-inline-icon" />
                      {formatDate(selectedRequest.requested_at)}
                    </strong>
                  </div>

                  <div className="mr-details-row">
                    <span className="mr-row-label">Last Atelier Log</span>
                    <strong className="mr-row-value">
                      <Clock size={13} className="mr-inline-icon" />
                      {formatDate(selectedRequest.updated_at)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* CLIENT DESCRIPTION */}
              <div className="mr-details-section">
                <h4 className="mr-section-title">
                  <ShoppingBag size={15} />
                  <span>Your Statement & Notes</span>
                </h4>
                <div className="mr-details-quote-box">
                  <p className="mr-details-description">
                    {selectedRequest.description ||
                      "No supplementary statement was recorded with this submission."}
                  </p>
                </div>
              </div>

              {/* ATELIER ADMIN NOTE */}
              <div className="mr-details-section">
                <h4 className="mr-section-title">
                  <ShieldCheck size={15} />
                  <span>Concierge & Atelier Assessment</span>
                </h4>
                <div className="mr-details-admin-box">
                  <p className="mr-details-description">
                    {selectedRequest.admin_note ||
                      `Our concierge team at ${storeName} is presently reviewing your drape dossier. Updates will be communicated here and to your registered credentials.`}
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="mr-modal-actions">
              <button
                type="button"
                className="mr-modal-close-btn"
                onClick={handleCloseDetails}
              >
                <span>Conclude & Close Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}