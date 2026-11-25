
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Search,
  RefreshCw,
  Eye,
  Package,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  X,
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Sparkles,
  ClipboardList,
  AlertCircle,
  Download,
  UserRound,
  IndianRupee,
} from "lucide-react";

import AdminNavbar from "../../components/admin/AdminNavbar";
import api from "../../services/api";
import "./AdminOrders.css";

const BACKEND_URL = "http://127.0.0.1:8000";

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const PAYMENT_STATUSES = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getOrderTotal = (order) =>
  order.total_amount ??
  order.total ??
  order.grand_total ??
  order.total_price ??
  order.amount ??
  0;

const getOrderItems = (order) => {
  const items =
    order.items ??
    order.order_items ??
    order.orderitem_set ??
    [];

  return Array.isArray(items) ? items : [];
};

const getCustomerName = (order) =>
  order.full_name ??
  order.customer_name ??
  order.name ??
  order.user?.username ??
  "Customer";

const getStatusClass = (status) =>
  String(status || "pending")
    .toLowerCase()
    .replaceAll(" ", "-");

const getLocalDateValue = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getItemName = (item) =>
  item.product_name ||
  item.product?.name ||
  item.product?.title ||
  item.name ||
  "Saree";

const getItemPrice = (item) =>
  item.price ??
  item.product_price ??
  item.product?.price ??
  0;

const getItemSubtotal = (item) =>
  item.subtotal ??
  item.sub_total ??
  Number(getItemPrice(item)) * Number(item.quantity || 1);

/* =========================================
   PRODUCT IMAGE HELPER
========================================= */

const getItemImage = (item) => {
  const image =
    item.product_image ||
    item.product_thumbnail ||
    item.image ||
    item.thumbnail ||
    item.image_url ||
    item.product?.image ||
    item.product?.thumbnail ||
    item.product?.image_url;

  if (!image || typeof image !== "string") {
    return "";
  }

  const imagePath = image.trim();

  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:") ||
    imagePath.startsWith("//")
  ) {
    return imagePath;
  }

  return `${BACKEND_URL}/${imagePath.replace(/^\/+/, "")}`;
};

/* =========================================
   PRODUCT IMAGE COMPONENT
========================================= */

function OrderItemImage({ item, name }) {
  const [imageError, setImageError] = useState(false);

  const imageURL = getItemImage(item);

  useEffect(() => {
    setImageError(false);
  }, [imageURL]);

  return (
    <div className="ao-item-image-wrapper">
      {imageURL && !imageError ? (
        <img
          src={imageURL}
          alt={name}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="ao-item-placeholder">
          <ShoppingBag size={22} />
          <span>No image</span>
        </div>
      )}
    </div>
  );
}

/* =========================================
   MAIN ADMIN ORDERS
========================================= */

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });

    window.setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);
  };

  /* =========================================
     FETCH ORDERS
  ========================================= */

  const fetchOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("orders/");
      const data = response.data;

      const orderList = Array.isArray(data)
        ? data
        : data.results || data.orders || data.data || [];

      setOrders(orderList);
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load orders. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* =========================================
     FILTER ORDERS
  ========================================= */

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        String(order.order_number || order.id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(getCustomerName(order))
          .toLowerCase()
          .includes(searchText) ||
        String(order.email || order.user?.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(order.phone || order.mobile || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        filterStatus === "All" || order.status === filterStatus;

      const orderDate = getLocalDateValue(order.created_at);

      const matchesDate =
        !filterDate || orderDate === filterDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, search, filterStatus, filterDate]);

  /* =========================================
     STATISTICS
  ========================================= */

  const statistics = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter(
        (order) => order.status === "Pending"
      ).length,

      processing: orders.filter(
        (order) =>
          order.status === "Processing" ||
          order.status === "Confirmed"
      ).length,

      shipped: orders.filter(
        (order) =>
          order.status === "Shipped" ||
          order.status === "Out for Delivery"
      ).length,

      delivered: orders.filter(
        (order) => order.status === "Delivered"
      ).length,

      revenue: orders
        .filter(
          (order) =>
            order.payment_status === "Paid" &&
            order.status !== "Cancelled"
        )
        .reduce(
          (total, order) =>
            total + Number(getOrderTotal(order)),
          0
        ),
    };
  }, [orders]);

  /* =========================================
     OPEN ORDER
  ========================================= */

  const openOrder = (order) => {
    setSelectedOrder({
      ...order,
      estimated_delivery_date:
        order.estimated_delivery_date || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedOrder(null);
  };

  /* =========================================
     HANDLE FORM CHANGES
  ========================================= */

  const handleStatusChange = (value) => {
    setSelectedOrder((previous) => ({
      ...previous,
      status: value,
    }));
  };

  const handlePaymentChange = (value) => {
    setSelectedOrder((previous) => ({
      ...previous,
      payment_status: value,
    }));
  };

  const handleDeliveryDateChange = (value) => {
    setSelectedOrder((previous) => ({
      ...previous,
      estimated_delivery_date: value,
    }));
  };

  /* =========================================
     UPDATE ORDER
  ========================================= */

  const updateOrder = async () => {
    if (!selectedOrder) return;

    try {
      setSaving(true);

      const response = await api.patch(
        `orders/${selectedOrder.id}/`,
        {
          status: selectedOrder.status,
          payment_status: selectedOrder.payment_status,
          estimated_delivery_date:
            selectedOrder.estimated_delivery_date || null,
        }
      );

      const updatedOrder =
        response.data.order || response.data;

      setOrders((previous) =>
        previous.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, ...updatedOrder }
            : order
        )
      );

      showToast("Order updated successfully.");

      setShowModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error("Order update failed:", err);

      showToast(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to update order.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     EXPORT CSV
  ========================================= */

  const exportOrdersCSV = () => {
    if (!filteredOrders.length) {
      showToast("No orders available to export.", "error");
      return;
    }

    const headers = [
      "Order Number",
      "Customer Name",
      "Email",
      "Phone",
      "Order Date",
      "Order Status",
      "Payment Status",
      "Estimated Delivery",
      "Delivered At",
      "Total Amount",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredOrders.map((order) => [
      order.order_number || order.id,
      getCustomerName(order),
      order.email || order.user?.email || "",
      order.phone || order.mobile || "",
      order.created_at || "",
      order.status || "",
      order.payment_status || "",
      order.estimated_delivery_date || "",
      order.delivered_at || "",
      getOrderTotal(order),
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sarika-orders-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast("Orders exported successfully.");
  };

  /* =========================================
     CLEAR FILTERS
  ========================================= */

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("All");
    setFilterDate("");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    filterStatus !== "All" ||
    filterDate !== "";

  return (
    <div className="ao-page">
      <AdminNavbar />

      <main className="ao-main">

        {/* HERO */}

        <section className="ao-hero">
          <div className="ao-hero-content">
            <div className="ao-hero-eyebrow">
              <Sparkles size={15} />
              SĀRIKA ADMINISTRATION
            </div>

            <h1>Order Management</h1>

            <p>
              Manage customer orders, payment updates, and delivery
              schedules from one place.
            </p>
          </div>

          <div className="ao-hero-icon">
            <ShoppingBag size={42} strokeWidth={1.3} />
          </div>
        </section>

        {/* STATISTICS */}

        <section className="ao-stat-grid">
          <div className="ao-stat-card">
            <div className="ao-stat-icon">
              <ClipboardList size={21} />
            </div>
            <div>
              <span>Total Orders</span>
              <strong>{statistics.total}</strong>
            </div>
          </div>

          <div className="ao-stat-card">
            <div className="ao-stat-icon">
              <Clock size={21} />
            </div>
            <div>
              <span>Pending Orders</span>
              <strong>{statistics.pending}</strong>
            </div>
          </div>

          <div className="ao-stat-card">
            <div className="ao-stat-icon">
              <Package size={21} />
            </div>
            <div>
              <span>Processing</span>
              <strong>{statistics.processing}</strong>
            </div>
          </div>

          <div className="ao-stat-card">
            <div className="ao-stat-icon">
              <Truck size={21} />
            </div>
            <div>
              <span>Shipped</span>
              <strong>{statistics.shipped}</strong>
            </div>
          </div>

          <div className="ao-stat-card">
            <div className="ao-stat-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Delivered</span>
              <strong>{statistics.delivered}</strong>
            </div>
          </div>

          <div className="ao-stat-card">
            <div className="ao-stat-icon">
              <IndianRupee size={21} />
            </div>
            <div>
              <span>Paid Revenue</span>
              <strong>{formatCurrency(statistics.revenue)}</strong>
            </div>
          </div>
        </section>

        {/* ORDERS REGISTER */}

        <section className="ao-register">
          <div className="ao-register-heading">
            <div>
              <span className="ao-section-eyebrow">
                ORDER MANAGEMENT
              </span>
              <h2>Orders Register</h2>
              <p>View and manage all customer orders.</p>
            </div>

            <div className="ao-register-actions">
              <button
                type="button"
                className="ao-export-button"
                onClick={exportOrdersCSV}
                disabled={!filteredOrders.length}
              >
                <Download size={16} />
                Export Orders
              </button>

              <button
                type="button"
                className="ao-refresh-button"
                onClick={() => fetchOrders(false)}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "ao-spinning" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* FILTER TOOLBAR */}

          <div className="ao-toolbar">
            <label className="ao-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search order number, customer, email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="ao-filter">
              <span>ORDER STATUS</span>
              <div className="ao-select-wrap">
                <select
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(event.target.value)
                  }
                >
                  <option value="All">All Statuses</option>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </label>

            <label className="ao-date-filter">
              <span>ORDER DATE</span>
              <div>
                <CalendarDays size={17} />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(event) =>
                    setFilterDate(event.target.value)
                  }
                />
              </div>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                className="ao-clear-filters"
                onClick={clearFilters}
              >
                <X size={15} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="ao-results-line">
            <span>
              Showing <strong>{filteredOrders.length}</strong> of{" "}
              <strong>{orders.length}</strong> orders
            </span>

            {filterDate && (
              <span>
                Selected date: <strong>{formatDate(filterDate)}</strong>
              </span>
            )}
          </div>

          {/* LOADING / ERROR / EMPTY */}

          {loading ? (
            <div className="ao-loading">
              <RefreshCw size={25} className="ao-spinning" />
              <p>Loading orders...</p>
            </div>
          ) : error ? (
            <div className="ao-error">
              <AlertCircle size={24} />
              <p>{error}</p>
              <button
                type="button"
                onClick={() => fetchOrders()}
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="ao-empty">
              <div className="ao-empty-icon">
                <ShoppingBag size={32} />
              </div>
              <h3>No orders found</h3>
              <p>
                {hasActiveFilters
                  ? "Try changing your search or filter options."
                  : "Customer orders will appear here."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="ao-table-wrapper">
                <table className="ao-table">
                  <thead>
                    <tr>
                      <th>ORDER</th>
                      <th>CUSTOMER</th>
                      <th>ORDER DATE</th>
                      <th>PAYMENT</th>
                      <th>ORDER STATUS</th>
                      <th>AMOUNT</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div className="ao-order-number">
                            #{order.order_number || order.id}
                          </div>
                          <span className="ao-order-items-count">
                            {getOrderItems(order).length} item(s)
                          </span>
                        </td>

                        <td>
                          <div className="ao-customer-cell">
                            <strong>{getCustomerName(order)}</strong>
                            <span>
                              {order.email ||
                                order.user?.email ||
                                "No email"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="ao-date-cell">
                            <CalendarDays size={15} />
                            {formatDate(order.created_at)}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`ao-status ao-payment-${getStatusClass(
                              order.payment_status
                            )}`}
                          >
                            {order.payment_status || "Pending"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`ao-status ao-order-${getStatusClass(
                              order.status
                            )}`}
                          >
                            {order.status || "Pending"}
                          </span>
                        </td>

                        <td>
                          <strong className="ao-amount">
                            {formatCurrency(getOrderTotal(order))}
                          </strong>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="ao-view-button"
                            onClick={() => openOrder(order)}
                          >
                            <Eye size={16} />
                            View
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="ao-mobile-orders">
                {filteredOrders.map((order) => (
                  <article
                    className="ao-mobile-order-card"
                    key={order.id}
                  >
                    <div className="ao-mobile-order-top">
                      <div>
                        <strong>
                          #{order.order_number || order.id}
                        </strong>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      <strong>
                        {formatCurrency(getOrderTotal(order))}
                      </strong>
                    </div>

                    <div className="ao-mobile-customer">
                      <UserRound size={16} />
                      <span>{getCustomerName(order)}</span>
                    </div>

                    <div className="ao-mobile-statuses">
                      <span
                        className={`ao-status ao-order-${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "Pending"}
                      </span>
                      <span
                        className={`ao-status ao-payment-${getStatusClass(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status || "Pending"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="ao-view-button"
                      onClick={() => openOrder(order)}
                    >
                      <Eye size={16} />
                      View Order
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* ORDER DETAIL MODAL */}

      {showModal && selectedOrder && (
        <div
          className="ao-modal-backdrop"
          onClick={closeModal}
        >
          <section
            className="ao-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="ao-modal-header">
              <div>
                <span className="ao-section-eyebrow">
                  ORDER DETAILS
                </span>
                <h2>
                  Order #{selectedOrder.order_number || selectedOrder.id}
                </h2>
                <p>
                  Placed on {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>

              <button
                type="button"
                className="ao-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close order details"
              >
                <X size={21} />
              </button>
            </header>

            <div className="ao-modal-content">
              {/* CUSTOMER AND ADDRESS */}

              <div className="ao-detail-grid">
                <div className="ao-detail-card">
                  <div className="ao-detail-card-heading">
                    <UserRound size={17} />
                    Customer Information
                  </div>

                  <h3>{getCustomerName(selectedOrder)}</h3>

                  <p>
                    <Mail size={15} />
                    {selectedOrder.email ||
                      selectedOrder.user?.email ||
                      "Not available"}
                  </p>

                  <p>
                    <Phone size={15} />
                    {selectedOrder.phone ||
                      selectedOrder.mobile ||
                      "Not available"}
                  </p>
                </div>

                <div className="ao-detail-card">
                  <div className="ao-detail-card-heading">
                    <MapPin size={17} />
                    Delivery Address
                  </div>

                  <p className="ao-address-text">
                    {selectedOrder.shipping_address ||
                      selectedOrder.address ||
                      selectedOrder.delivery_address ||
                      "Address not available"}
                  </p>

                  {(selectedOrder.city ||
                    selectedOrder.state ||
                    selectedOrder.pincode ||
                    selectedOrder.postal_code) && (
                    <p className="ao-address-text">
                      {[
                        selectedOrder.city,
                        selectedOrder.state,
                        selectedOrder.pincode ||
                          selectedOrder.postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* ORDERED PRODUCTS */}

              <div className="ao-detail-section">
                <div className="ao-detail-section-heading">
                  <Package size={18} />
                  <h3>Ordered Products</h3>
                </div>

                {getOrderItems(selectedOrder).length > 0 ? (
                  <div className="ao-items-list">
                    {getOrderItems(selectedOrder).map(
                      (item, index) => (
                        <div
                          className="ao-item-row"
                          key={item.id || index}
                        >
                          <div className="ao-item-info">
                            <OrderItemImage
                              item={item}
                              name={getItemName(item)}
                            />

                            <div className="ao-item-description">
                              <strong>{getItemName(item)}</strong>
                              <span>
                                Quantity: {item.quantity || 1}
                              </span>
                            </div>
                          </div>

                          <div className="ao-item-price">
                            <span>
                              {formatCurrency(getItemPrice(item))}
                            </span>
                            <strong>
                              {formatCurrency(getItemSubtotal(item))}
                            </strong>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="ao-no-items">
                    Product details are not available.
                  </p>
                )}
              </div>

              {/* TOTALS */}

              <div className="ao-total-panel">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    {formatCurrency(
                      selectedOrder.subtotal ??
                        getOrderTotal(selectedOrder)
                    )}
                  </strong>
                </div>

                {selectedOrder.shipping_charge != null && (
                  <div>
                    <span>Shipping</span>
                    <strong>
                      {formatCurrency(selectedOrder.shipping_charge)}
                    </strong>
                  </div>
                )}

                {selectedOrder.discount != null && (
                  <div>
                    <span>Discount</span>
                    <strong>
                      -{formatCurrency(selectedOrder.discount)}
                    </strong>
                  </div>
                )}

                <div className="ao-grand-total">
                  <span>Total Amount</span>
                  <strong>
                    {formatCurrency(getOrderTotal(selectedOrder))}
                  </strong>
                </div>
              </div>

              {/* PAYMENT */}

              <div className="ao-payment-info">
                <div>
                  <span>Payment Method</span>
                  <strong>
                    {selectedOrder.payment_method || "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Payment Status</span>
                  <strong>
                    {selectedOrder.payment_status || "Pending"}
                  </strong>
                </div>
              </div>

              {/* DELIVERY MANAGEMENT */}

              <section className="ao-delivery-section">
                <div className="ao-delivery-heading">
                  <div className="ao-delivery-icon">
                    <Truck size={20} />
                  </div>

                  <div>
                    <h3>Delivery Management</h3>
                    <p>
                      Set and manage the customer's delivery date.
                    </p>
                  </div>
                </div>

                <div className="ao-delivery-fields">
                  <label>
                    <span>ESTIMATED DELIVERY DATE</span>
                    <input
                      type="date"
                      value={
                        selectedOrder.estimated_delivery_date || ""
                      }
                      onChange={(event) =>
                        handleDeliveryDateChange(event.target.value)
                      }
                      disabled={
                        selectedOrder.status === "Delivered" ||
                        selectedOrder.status === "Cancelled"
                      }
                    />
                  </label>

                  <div className="ao-delivery-date-preview">
                    <CalendarDays size={18} />
                    <div>
                      <span>Expected Delivery</span>
                      <strong>
                        {selectedOrder.estimated_delivery_date
                          ? formatDate(
                              selectedOrder.estimated_delivery_date
                            )
                          : "Date not selected"}
                      </strong>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === "Delivered" && (
                  <div className="ao-actual-delivery">
                    <CheckCircle2 size={18} />
                    <div>
                      <span>ACTUAL DELIVERY DATE</span>
                      <strong>
                        {selectedOrder.delivered_at
                          ? formatDateTime(selectedOrder.delivered_at)
                          : "Delivery date not recorded"}
                      </strong>
                    </div>
                  </div>
                )}

                {selectedOrder.status === "Cancelled" && (
                  <p className="ao-delivery-note">
                    Delivery date cannot be changed for cancelled orders.
                  </p>
                )}
              </section>

              {/* UPDATE ORDER */}

              <section className="ao-update-section">
                <div className="ao-detail-section-heading">
                  <ClipboardList size={18} />
                  <h3>Update Order</h3>
                </div>

                <div className="ao-update-fields">
                  <label>
                    <span>ORDER STATUS</span>
                    <div className="ao-select-wrap">
                      <select
                        value={selectedOrder.status || "Pending"}
                        onChange={(event) =>
                          handleStatusChange(event.target.value)
                        }
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} />
                    </div>
                  </label>

                  <label>
                    <span>PAYMENT STATUS</span>
                    <div className="ao-select-wrap">
                      <select
                        value={
                          selectedOrder.payment_status || "Pending"
                        }
                        onChange={(event) =>
                          handlePaymentChange(event.target.value)
                        }
                      >
                        {PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} />
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* MODAL FOOTER */}

            <footer className="ao-modal-footer">
              <button
                type="button"
                className="ao-cancel-button"
                onClick={closeModal}
                disabled={saving}
              >
                Close
              </button>

              <button
                type="button"
                className="ao-save-button"
                onClick={updateOrder}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="ao-spinning" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* TOAST */}

      {toast.show && (
        <div
          className={`ao-toast ao-toast-${toast.type}`}
          role="status"
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{toast.message}</span>

          <button
            type="button"
            onClick={() =>
              setToast({
                show: false,
                message: "",
                type: "success",
              })
            }
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
