
import React, { useEffect, useState, useCallback, useMemo } from "react";

import {
  Search,
  RefreshCw,
  Download,
  Eye,
  Users,
  ShoppingBag,
  IndianRupee,
  X,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Package,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Loader2,
  Filter,
  RotateCcw,
} from "lucide-react";

import AdminNavbar from "../../components/admin/AdminNavbar";
import api from "../../services/api";
import "./AdminCustomers.css";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  // Customer filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [updatingCustomerId, setUpdatingCustomerId] = useState(null);

  const [pendingCustomer, setPendingCustomer] = useState(null);
  const [toast, setToast] = useState(null);

  // --------------------------------
  // FETCH CUSTOMERS
  // --------------------------------

  const fetchCustomers = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("admin/customers/", {
        params: search.trim()
          ? { search: search.trim() }
          : {},
      });

      setCustomers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Customer fetch error:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Unable to load customers. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // --------------------------------
  // FORMAT HELPERS
  // --------------------------------

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCustomerName = (customer) => {
    const fullName = [
      customer?.first_name,
      customer?.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || customer?.username || "Customer";
  };

  // --------------------------------
  // FILTER AND SORT CUSTOMERS
  // --------------------------------

  const displayedCustomers = useMemo(() => {
    let result = [...customers];

    // Account status filter
    if (statusFilter === "active") {
      result = result.filter(
        (customer) => customer.is_active === true
      );
    } else if (statusFilter === "inactive") {
      result = result.filter(
        (customer) => customer.is_active === false
      );
    }

    // Registration date sorting
    result.sort((a, b) => {
      const dateA = a.registration_date
        ? new Date(a.registration_date).getTime()
        : 0;

      const dateB = b.registration_date
        ? new Date(b.registration_date).getTime()
        : 0;

      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });

    return result;
  }, [customers, statusFilter, sortOrder]);

  // --------------------------------
  // STATISTICS
  // --------------------------------

  const totalCustomers = displayedCustomers.length;

  const activeCustomers = displayedCustomers.filter(
    (customer) => customer.is_active
  ).length;

  const inactiveCustomers = displayedCustomers.filter(
    (customer) => !customer.is_active
  ).length;

  const totalOrders = displayedCustomers.reduce(
    (total, customer) =>
      total + Number(customer.total_orders || 0),
    0
  );

  const totalSpending = displayedCustomers.reduce(
    (total, customer) =>
      total + Number(customer.total_spent || 0),
    0
  );

  const hasActiveFilters =
    statusFilter !== "all" ||
    sortOrder !== "newest";

  const clearFilters = () => {
    setStatusFilter("all");
    setSortOrder("newest");
  };

  // --------------------------------
  // EXPORT FILTERED CUSTOMERS TO CSV
  // --------------------------------

  const handleExportCSV = () => {
    if (displayedCustomers.length === 0) {
      setToast({
        type: "error",
        title: "No Customers to Export",
        message:
          "There are no customer records available to download.",
      });
      return;
    }

    const headers = [
      "Customer ID",
      "Username",
      "Customer Name",
      "Email",
      "Phone",
      "City",
      "State",
      "Registration Date",
      "Total Orders",
      "Total Spent",
      "Account Status",
    ];

    const escapeCSV = (value) => {
      let text = String(value ?? "");

      if (/^[\s]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = displayedCustomers.map((customer) => [
      customer.id,
      customer.username,
      getCustomerName(customer),
      customer.email,
      customer.phone,
      customer.city,
      customer.state,
      formatDate(customer.registration_date),
      customer.total_orders || 0,
      customer.total_spent || 0,
      customer.is_active ? "Active" : "Inactive",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const today = new Date().toISOString().split("T")[0];

    link.href = url;
    link.download = `SARIKA_Customers_${today}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setToast({
      type: "success",
      title: "Customer Report Exported!",
      message: `${displayedCustomers.length} customer records have been exported successfully.`,
      statusLabel: "DOWNLOAD COMPLETE",
    });
  };

  // --------------------------------
  // CUSTOMER DETAILS
  // --------------------------------

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerDetails(null);
    setDetailsLoading(true);

    try {
      const response = await api.get(
        `admin/customers/${customer.id}/`
      );

      setCustomerDetails(response.data);
    } catch (err) {
      console.error("Customer details error:", err);

      setSelectedCustomer(null);

      setToast({
        type: "error",
        title: "Unable to Load Details",
        message:
          err.response?.data?.error ||
          "Unable to load customer details. Please try again.",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerDetails(null);
  };

  // --------------------------------
  // CONFIRMATION DIALOG
  // --------------------------------

  const handleToggleStatus = (customer) => {
    setPendingCustomer(customer);
  };

  // --------------------------------
  // ACTIVATE / DEACTIVATE CUSTOMER
  // --------------------------------

  const confirmStatusChange = async () => {
    if (!pendingCustomer) return;

    const customer = pendingCustomer;
    const newStatus = !customer.is_active;

    try {
      setUpdatingCustomerId(customer.id);

      const response = await api.patch(
        `admin/customers/${customer.id}/status/`,
        {
          is_active: newStatus,
        }
      );

      const updatedStatus = response.data.is_active;

      setCustomers((previousCustomers) =>
        previousCustomers.map((item) =>
          item.id === customer.id
            ? { ...item, is_active: updatedStatus }
            : item
        )
      );

      setSelectedCustomer((previous) =>
        previous?.id === customer.id
          ? { ...previous, is_active: updatedStatus }
          : previous
      );

      setCustomerDetails((previous) => {
        if (!previous?.customer) return previous;

        return {
          ...previous,
          customer: {
            ...previous.customer,
            is_active: updatedStatus,
          },
        };
      });

      setPendingCustomer(null);

      setToast({
        type: "success",
        title: updatedStatus
          ? "Account Activated!"
          : "Successfully Deactivated!",
        message: updatedStatus
          ? "The customer account has been activated successfully. The customer can now access their account."
          : "The customer account has been deactivated successfully. The customer will no longer be able to log in.",
        statusLabel: updatedStatus ? "ACTIVE" : "INACTIVE",
      });

    } catch (err) {
      console.error("Customer status update error:", err);

      setPendingCustomer(null);

      setToast({
        type: "error",
        title: "Update Unsuccessful",
        message:
          err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to update customer status. Please try again.",
      });
    } finally {
      setUpdatingCustomerId(null);
    }
  };

  // --------------------------------
  // STATUS BUTTON
  // --------------------------------

  const renderStatusButton = (customer) => {
    const isUpdating = updatingCustomerId === customer.id;

    return (
      <button
        type="button"
        className={`ac-toggle-btn ${
          customer.is_active
            ? "ac-deactivate-btn"
            : "ac-activate-btn"
        }`}
        onClick={() => handleToggleStatus(customer)}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <Loader2 size={14} className="ac-spin" />
        ) : customer.is_active ? (
          <UserX size={14} />
        ) : (
          <UserCheck size={14} />
        )}

        {isUpdating
          ? "Updating..."
          : customer.is_active
          ? "Deactivate"
          : "Activate"}
      </button>
    );
  };

  // --------------------------------
  // CUSTOMER TABLE ROW
  // --------------------------------

  const renderCustomerStatus = (customer) => (
    <span
      className={`ac-status ${
        customer.is_active
          ? "ac-status-active"
          : "ac-status-inactive"
      }`}
    >
      {customer.is_active ? (
        <CheckCircle2 size={12} />
      ) : (
        <XCircle size={12} />
      )}

      {customer.is_active ? "Active" : "Inactive"}
    </span>
  );

  // --------------------------------
  // PAGE JSX
  // --------------------------------

  return (
    <div className="ac-page">

      <AdminNavbar />

      <main className="ac-container">

        {/* PAGE HEADER */}

        <div className="ac-page-header">
          <div>
            <span className="ac-page-eyebrow">
              SĀRIKA ADMINISTRATION
            </span>

            <h1>Customers</h1>

            <p>
              Manage your registered customers and their accounts.
            </p>
          </div>

          <div className="ac-header-actions">

            <button
              type="button"
              className="ac-export-btn"
              onClick={handleExportCSV}
              disabled={loading || displayedCustomers.length === 0}
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              type="button"
              className="ac-refresh-btn"
              onClick={() => fetchCustomers(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "ac-spin" : ""}
              />
              Refresh
            </button>

          </div>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="ac-error-message">
            <XCircle size={17} />
            {error}
          </div>
        )}

        {/* STATISTICS */}

        <div className="ac-stats-grid">

          <div className="ac-stat-card">
            <div className="ac-stat-icon ac-icon-customers">
              <Users size={21} />
            </div>

            <div>
              <p>Total Customers</p>
              <h2>{totalCustomers}</h2>
              <small>Customers matching current filters</small>
            </div>
          </div>

          <div className="ac-stat-card">
            <div className="ac-stat-icon ac-icon-orders">
              <ShoppingBag size={21} />
            </div>

            <div>
              <p>Total Orders</p>
              <h2>{totalOrders}</h2>
              <small>Orders from displayed customers</small>
            </div>
          </div>

          <div className="ac-stat-card">
            <div className="ac-stat-icon ac-icon-spending">
              <IndianRupee size={21} />
            </div>

            <div>
              <p>Paid Spending</p>
              <h2>{formatCurrency(totalSpending)}</h2>
              <small>Paid orders from displayed customers</small>
            </div>
          </div>

        </div>

        {/* ACCOUNT STATUS SUMMARY */}

        <div className="ac-status-summary">
          <div>
            <span className="ac-summary-dot ac-dot-active" />
            <span>Active Accounts</span>
            <strong>{activeCustomers}</strong>
          </div>

          <div>
            <span className="ac-summary-dot ac-dot-inactive" />
            <span>Inactive Accounts</span>
            <strong>{inactiveCustomers}</strong>
          </div>
        </div>

        {/* CUSTOMER DIRECTORY */}

        <section className="ac-directory">

          <div className="ac-directory-header">

            <div>
              <h2>Customer Directory</h2>
              <p>
                View and manage registered customer information.
              </p>
            </div>

            {/* SEARCH */}

            <div className="ac-search-box">
              <Search size={16} />

              <input
                type="text"
                placeholder="Search name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* FILTERS */}

            <div className="ac-directory-tools">

              <div className="ac-filter-group">
                <label htmlFor="ac-status-filter">
                  <Filter size={13} /> Account
                </label>

                <select
                  id="ac-status-filter"
                  className="ac-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  <option value="active">Active Accounts</option>
                  <option value="inactive">Inactive Accounts</option>
                </select>
              </div>

              <div className="ac-filter-group">
                <label htmlFor="ac-sort-filter">
                  <CalendarDays size={13} /> Sort
                </label>

                <select
                  id="ac-sort-filter"
                  className="ac-filter-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <button
                type="button"
                className="ac-clear-filters"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                <RotateCcw size={13} />
                Clear Filters
              </button>

            </div>

          </div>

          {/* FILTER RESULT */}

          <div className="ac-filter-result">
            <span>
              Showing <strong>{displayedCustomers.length}</strong> of{" "}
              <strong>{customers.length}</strong> matching search results
            </span>

            <span>
              {statusFilter === "active"
                ? "Active Accounts"
                : statusFilter === "inactive"
                ? "Inactive Accounts"
                : "All Accounts"}
            </span>
          </div>

          {/* DESKTOP TABLE */}

          <div className="ac-table-wrapper">
            <table className="ac-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Account</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="ac-table-message">
                      <Loader2 size={22} className="ac-spin" />
                      Loading customers...
                    </td>
                  </tr>
                ) : displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="ac-table-message">
                      No customers found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((customer) => (
                    <tr key={customer.id}>

                      <td>
                        <div className="ac-customer-info">
                          <div className="ac-avatar">
                            {getCustomerName(customer)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{getCustomerName(customer)}</strong>
                            <span>@{customer.username}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ac-contact-info">
                          <span>
                            <Mail size={12} />
                            {customer.email || "No email"}
                          </span>

                          <span>
                            <Phone size={12} />
                            {customer.phone || "No phone"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {formatDate(customer.registration_date)}
                      </td>

                      <td>
                        <span className="ac-order-count">
                          {customer.total_orders || 0}
                        </span>
                      </td>

                      <td>
                        <strong className="ac-spent">
                          {formatCurrency(customer.total_spent)}
                        </strong>
                      </td>

                      <td>{renderCustomerStatus(customer)}</td>

                      <td>
                        <div className="ac-action-buttons">

                          <button
                            type="button"
                            className="ac-view-btn"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {renderStatusButton(customer)}

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

          {/* MOBILE CUSTOMER CARDS */}

          <div className="ac-mobile-list">

            {loading ? (
              <div className="ac-mobile-message">
                <Loader2 size={22} className="ac-spin" />
                Loading customers...
              </div>
            ) : displayedCustomers.length === 0 ? (
              <div className="ac-mobile-message">
                No customers found for the selected filters.
              </div>
            ) : (
              displayedCustomers.map((customer) => (
                <div className="ac-mobile-card" key={customer.id}>

                  <div className="ac-mobile-top">
                    <div className="ac-customer-info">
                      <div className="ac-avatar">
                        {getCustomerName(customer)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{getCustomerName(customer)}</strong>
                        <span>@{customer.username}</span>
                      </div>
                    </div>

                    {renderCustomerStatus(customer)}
                  </div>

                  <div className="ac-mobile-details">
                    <span>
                      <Mail size={13} />
                      {customer.email || "No email"}
                    </span>

                    <span>
                      <Phone size={13} />
                      {customer.phone || "No phone"}
                    </span>

                    <span>
                      <CalendarDays size={13} />
                      {formatDate(customer.registration_date)}
                    </span>
                  </div>

                  <div className="ac-mobile-stats">
                    <div>
                      <small>Orders</small>
                      <strong>{customer.total_orders || 0}</strong>
                    </div>

                    <div>
                      <small>Total Spent</small>
                      <strong>
                        {formatCurrency(customer.total_spent)}
                      </strong>
                    </div>
                  </div>

                  <div className="ac-mobile-actions">
                    <button
                      type="button"
                      className="ac-view-btn"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <Eye size={14} />
                      View Details
                    </button>

                    {renderStatusButton(customer)}
                  </div>

                </div>
              ))
            )}

          </div>

          <div className="ac-directory-footer">
            Showing {displayedCustomers.length} customers
          </div>

        </section>

      </main>

      {/* =================================
          CUSTOMER DETAILS MODAL
      ================================= */}

      {selectedCustomer && (
        <div
          className="ac-modal-overlay"
          onClick={closeCustomerDetails}
        >
          <div
            className="ac-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="ac-modal-header">
              <div>
                <span className="ac-modal-eyebrow">
                  SĀRIKA CUSTOMER PROFILE
                </span>
                <h2>Customer Details</h2>
                <p>Customer profile and order history</p>
              </div>

              <button
                type="button"
                className="ac-modal-close"
                onClick={closeCustomerDetails}
              >
                <X size={20} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="ac-modal-loading">
                <Loader2 size={28} className="ac-spin" />
                <p>Loading customer details...</p>
              </div>
            ) : customerDetails ? (
              <div className="ac-modal-body">

                <div className="ac-detail-profile">
                  <div className="ac-detail-avatar">
                    {getCustomerName(
                      customerDetails.customer
                    ).charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>
                      {getCustomerName(customerDetails.customer)}
                    </h3>

                    <span>
                      @{customerDetails.customer.username}
                    </span>

                    <div>
                      <span
                        className={`ac-status ${
                          customerDetails.customer.is_active
                            ? "ac-status-active"
                            : "ac-status-inactive"
                        }`}
                      >
                        {customerDetails.customer.is_active
                          ? "Active Account"
                          : "Inactive Account"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CONTACT INFORMATION */}

                <section className="ac-detail-section">
                  <h3>Contact Information</h3>

                  <div className="ac-detail-grid">

                    <div>
                      <Mail size={15} />
                      <div>
                        <small>Email</small>
                        <strong>
                          {customerDetails.customer.email || "—"}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <Phone size={15} />
                      <div>
                        <small>Phone</small>
                        <strong>
                          {customerDetails.customer.phone || "—"}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <CalendarDays size={15} />
                      <div>
                        <small>Registered</small>
                        <strong>
                          {formatDate(
                            customerDetails.customer.registration_date
                          )}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <MapPin size={15} />
                      <div>
                        <small>Address</small>
                        <strong>
                          {[
                            customerDetails.customer.address,
                            customerDetails.customer.city,
                            customerDetails.customer.state,
                            customerDetails.customer.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "No address available"}
                        </strong>
                      </div>
                    </div>

                  </div>
                </section>

                {/* STATISTICS */}

                <section className="ac-detail-section">
                  <h3>Customer Statistics</h3>

                  <div className="ac-detail-stats">

                    <div>
                      <Package size={18} />
                      <small>Total Orders</small>
                      <strong>
                        {customerDetails.statistics?.total_orders || 0}
                      </strong>
                    </div>

                    <div>
                      <IndianRupee size={18} />
                      <small>Paid Spending</small>
                      <strong>
                        {formatCurrency(
                          customerDetails.statistics?.total_spent
                        )}
                      </strong>
                    </div>

                  </div>
                </section>

                {/* ORDER HISTORY */}

                <section className="ac-detail-section">
                  <h3>Order History</h3>

                  {!customerDetails.orders ||
                  customerDetails.orders.length === 0 ? (
                    <div className="ac-no-orders">
                      No orders found for this customer.
                    </div>
                  ) : (
                    <div className="ac-orders-table-wrapper">
                      <table className="ac-orders-table">

                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                          </tr>
                        </thead>

                        <tbody>
                          {customerDetails.orders.map((order) => (
                            <tr key={order.id}>
                              <td>
                                {order.order_number || `#${order.id}`}
                              </td>

                              <td>{formatDate(order.created_at)}</td>

                              <td>
                                {formatCurrency(order.total_amount)}
                              </td>

                              <td>{order.status || "—"}</td>

                              <td>{order.payment_status || "—"}</td>
                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>
                  )}
                </section>

                {/* MODAL ACTIONS */}

                <div className="ac-modal-actions">
                  {renderStatusButton(customerDetails.customer)}

                  <button
                    type="button"
                    className="ac-modal-done"
                    onClick={closeCustomerDetails}
                  >
                    Close
                  </button>
                </div>

              </div>
            ) : (
              <div className="ac-modal-loading">
                Unable to load customer information.
              </div>
            )}

          </div>
        </div>
      )}

      {/* =================================
          LUXURY CONFIRMATION DIALOG
      ================================= */}

      {pendingCustomer && (
        <div
          className="ac-dialog-overlay"
          onClick={() => {
            if (updatingCustomerId !== pendingCustomer.id) {
              setPendingCustomer(null);
            }
          }}
        >
          <div
            className="ac-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              type="button"
              className="ac-dialog-close"
              onClick={() => setPendingCustomer(null)}
              disabled={updatingCustomerId === pendingCustomer.id}
            >
              <X size={19} />
            </button>

            <div
              className={`ac-dialog-icon ${
                pendingCustomer.is_active
                  ? "ac-dialog-icon-warning"
                  : "ac-dialog-icon-success"
              }`}
            >
              {pendingCustomer.is_active ? (
                <UserX size={28} />
              ) : (
                <UserCheck size={28} />
              )}
            </div>

            <span className="ac-dialog-eyebrow">
              SĀRIKA CUSTOMER MANAGEMENT
            </span>

            <h2>
              {pendingCustomer.is_active
                ? "Deactivate Account?"
                : "Activate Account?"}
            </h2>

            <p>
              Are you sure you want to{" "}
              <strong>
                {pendingCustomer.is_active
                  ? "deactivate"
                  : "activate"}
              </strong>{" "}
              this customer's account?
            </p>

            <div className="ac-dialog-customer">
              <div className="ac-dialog-avatar">
                {getCustomerName(pendingCustomer)
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>{getCustomerName(pendingCustomer)}</strong>
                <span>
                  {pendingCustomer.email || "No email available"}
                </span>
              </div>
            </div>

            <div className="ac-dialog-actions">

              <button
                type="button"
                className="ac-dialog-cancel"
                onClick={() => setPendingCustomer(null)}
                disabled={updatingCustomerId === pendingCustomer.id}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`ac-dialog-confirm ${
                  pendingCustomer.is_active
                    ? "ac-dialog-confirm-danger"
                    : "ac-dialog-confirm-success"
                }`}
                onClick={confirmStatusChange}
                disabled={updatingCustomerId === pendingCustomer.id}
              >
                {updatingCustomerId === pendingCustomer.id
                  ? "Please wait..."
                  : pendingCustomer.is_active
                  ? "Yes, Deactivate"
                  : "Yes, Activate"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =================================
          LUXURY SUCCESS / ERROR POPUP
      ================================= */}

      {toast && (
        <div
          className="ac-toast-overlay"
          onClick={() => setToast(null)}
        >
          <div
            className={`ac-toast-card ac-toast-${toast.type}`}
            onClick={(e) => e.stopPropagation()}
          >

            <button
              type="button"
              className="ac-toast-close"
              onClick={() => setToast(null)}
            >
              <X size={17} />
            </button>

            <span className="ac-toast-eyebrow">
              SĀRIKA · CUSTOMER MANAGEMENT
            </span>

            <div className="ac-toast-icon">
              {toast.type === "success" ? (
                <CheckCircle2 size={34} />
              ) : (
                <XCircle size={34} />
              )}
            </div>

            <h3>{toast.title}</h3>

            <p>{toast.message}</p>

            {toast.type === "success" && (
              <div className="ac-toast-status">
                <span>STATUS</span>

                <strong
                  className={
                    toast.statusLabel === "ACTIVE"
                      ? "ac-toast-active-label"
                      : toast.statusLabel === "INACTIVE"
                      ? "ac-toast-inactive-label"
                      : "ac-toast-active-label"
                  }
                >
                  <span className="ac-toast-status-dot" />
                  {toast.statusLabel}
                </strong>
              </div>
            )}

            <button
              type="button"
              className="ac-toast-ok"
              onClick={() => setToast(null)}
            >
              Continue
            </button>

            <span className="ac-toast-footer">
              Thank you for managing SĀRIKA customers.
            </span>

          </div>
        </div>
      )}

    </div>
  );
}
