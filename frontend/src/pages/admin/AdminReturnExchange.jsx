
import React, { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  X,
  AlertCircle,
} from "lucide-react";

import adminApi from "../../services/api";
import "./AdminReturnExchange.css";

const STATUSES = ["All", "Pending", "Approved", "Rejected", "Completed"];

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (data?.message) return data.message;
  if (data?.detail) return data.detail;

  return "Something went wrong. Please try again.";
};

export default function AdminReturnExchange() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // =====================================
  // FETCH REQUESTS
  // =====================================

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminApi.get(
        "orders/admin/return-exchanges/"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setRequests(data);
    } catch (err) {
      console.error("Return requests error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // =====================================
  // FILTER REQUESTS
  // =====================================

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      activeStatus === "All" ||
      request.status === activeStatus;

    const searchText = search.toLowerCase();

    const matchesSearch = [
      request.id,
      request.order,
      request.order_number,
      request.customer_name,
      request.customer_email,
      request.product_name,
      request.reason,
      request.request_type,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(searchText)
      );

    return matchesStatus && matchesSearch;
  });

  // =====================================
  // STATUS COUNTS
  // =====================================

  const getCount = (status) => {
    if (status === "All") return requests.length;

    return requests.filter(
      (request) => request.status === status
    ).length;
  };

  // =====================================
  // OPEN DETAILS
  // =====================================

  const openDetails = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.admin_note || "");
    setMessage("");
  };

  // =====================================
  // UPDATE REQUEST
  // =====================================

  const updateRequest = async (newStatus) => {
    if (!selectedRequest) return;

    try {
      setUpdating(true);
      setMessage("");

      const response = await adminApi.patch(
        `orders/admin/return-exchanges/${selectedRequest.id}/`,
        {
          status: newStatus,
          admin_note: adminNote,
        }
      );

      const updatedRequest =
        response.data?.request || response.data;

      setRequests((previous) =>
        previous.map((request) =>
          request.id === selectedRequest.id
            ? { ...request, ...updatedRequest }
            : request
        )
      );

      setSelectedRequest((previous) => ({
        ...previous,
        ...updatedRequest,
      }));

      setMessageType("success");
      setMessage(
        response.data?.message ||
          `Request updated to ${newStatus}.`
      );

      await fetchRequests();

      setSelectedRequest(null);
    } catch (err) {
      console.error("Request update error:", err);
      setMessageType("error");
      setMessage(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  // =====================================
  // STATUS ICON
  // =====================================

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 size={15} />;

      case "Rejected":
        return <XCircle size={15} />;

      case "Completed":
        return <Package size={15} />;

      default:
        return <Clock size={15} />;
    }
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="are-page">
        <div className="are-loading">
          <RefreshCw className="are-spin" size={30} />
          <p>Loading return requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="are-page">
      <div className="are-container">

        {/* HEADER */}

        <div className="are-header">
          <div>
            <span className="are-eyebrow">
              SĀRIKA ADMINISTRATION
            </span>

            <h1>Return & Exchange Requests</h1>

            <p>
              Manage customer return and exchange requests.
            </p>
          </div>

          <button
            type="button"
            className="are-refresh"
            onClick={fetchRequests}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="are-error">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div className="are-stats">
          {STATUSES.map((status) => (
            <button
              type="button"
              key={status}
              className={`are-stat ${
                activeStatus === status ? "active" : ""
              }`}
              onClick={() => setActiveStatus(status)}
            >
              <span>{status} Requests</span>
              <strong>{getCount(status)}</strong>
            </button>
          ))}
        </div>

        {/* SEARCH */}

        <div className="are-toolbar">
          <div className="are-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search order, customer, product..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <span className="are-results">
            {filteredRequests.length} request(s)
          </span>
        </div>

        {/* REQUEST TABLE */}

        <div className="are-table-wrapper">
          <table className="are-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="are-empty">
                    <Package size={35} />
                    <p>No return/exchange requests found.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>#{request.id}</td>

                    <td>
                      {request.order_number ||
                        `#${request.order}`}
                    </td>

                    <td>
                      <strong>
                        {request.customer_name ||
                          request.customer_email ||
                          `Customer #${request.customer}`}
                      </strong>
                    </td>

                    <td>{request.request_type}</td>

                    <td>{request.reason}</td>

                    <td>{formatDate(request.requested_at)}</td>

                    <td>
                      <span
                        className={`are-status ${String(
                          request.status
                        ).toLowerCase()}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="are-view-button"
                        onClick={() => openDetails(request)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================
          REQUEST DETAILS MODAL
      ================================= */}

      {selectedRequest && (
        <div
          className="are-modal-overlay"
          onClick={() => {
            if (!updating) setSelectedRequest(null);
          }}
        >
          <div
            className="are-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="are-modal-header">
              <div>
                <span className="are-eyebrow">
                  REQUEST #{selectedRequest.id}
                </span>

                <h2>Request Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                disabled={updating}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <div className="are-detail-grid">
              <div>
                <span>Order Number</span>
                <strong>
                  {selectedRequest.order_number ||
                    `#${selectedRequest.order}`}
                </strong>
              </div>

              <div>
                <span>Customer</span>
                <strong>
                  {selectedRequest.customer_name ||
                    selectedRequest.customer_email ||
                    `Customer #${selectedRequest.customer}`}
                </strong>
              </div>

              <div>
                <span>Request Type</span>
                <strong>{selectedRequest.request_type}</strong>
              </div>

              <div>
                <span>Reason</span>
                <strong>{selectedRequest.reason}</strong>
              </div>

              <div>
                <span>Request Date</span>
                <strong>
                  {formatDate(selectedRequest.requested_at)}
                </strong>
              </div>

              <div>
                <span>Current Status</span>
                <strong>{selectedRequest.status}</strong>
              </div>
            </div>

            <div className="are-description">
              <label>Customer Description</label>

              <p>
                {selectedRequest.description ||
                  "No additional description provided."}
              </p>
            </div>

            <div className="are-note">
              <label>Admin Note</label>

              <textarea
                rows="4"
                placeholder="Write a note for this request..."
                value={adminNote}
                onChange={(event) =>
                  setAdminNote(event.target.value)
                }
                disabled={updating}
              />
            </div>

            {message && (
              <div className={`are-message ${messageType}`}>
                {message}
              </div>
            )}

            {/* ACTIONS */}

            <div className="are-modal-actions">
              {selectedRequest.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="are-reject"
                    onClick={() => updateRequest("Rejected")}
                    disabled={updating}
                  >
                    <XCircle size={17} />
                    Reject
                  </button>

                  <button
                    type="button"
                    className="are-approve"
                    onClick={() => updateRequest("Approved")}
                    disabled={updating}
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>
                </>
              )}

              {selectedRequest.status === "Approved" && (
                <button
                  type="button"
                  className="are-approve"
                  onClick={() => updateRequest("Completed")}
                  disabled={updating}
                >
                  <CheckCircle2 size={17} />
                  Mark Completed
                </button>
              )}

              {updating && (
                <span className="are-updating">
                  Updating...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
