
import { useEffect, useState } from "react";
import {
  Mail,
  Search,
  Eye,
  Trash2,
  X,
  Send,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";
import "./AdminContactMessages.css";

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("New");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const response = await api.get("admin/contact/messages/", {
        params: {
          search,
          status: statusFilter,
        },
      });

      setMessages(response.data.data || []);
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.response?.data?.detail ||
          "Unable to load contact messages. Please check admin login.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [search, statusFilter]);

  const openMessage = async (id) => {
    try {
      const response = await api.get(`admin/contact/messages/${id}/`);
      const message = response.data.data;

      setSelectedMessage(message);
      setReply(message.admin_reply || "");
      setNewStatus(message.status);
      setNotice({ type: "", text: "" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.detail || "Unable to open message.",
      });
    }
  };

  const updateMessage = async () => {
    if (!selectedMessage) return;

    try {
      setSaving(true);

      await api.patch(
        `admin/contact/messages/${selectedMessage.id}/`,
        {
          status: newStatus,
          admin_reply: reply,
        }
      );

      setNotice({
        type: "success",
        text: "Contact message updated successfully.",
      });

      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.detail || "Unable to update message.",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this contact message?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`admin/contact/messages/${id}/`);

      setMessages((previous) =>
        previous.filter((message) => message.id !== id)
      );

      setSelectedMessage(null);

      setNotice({
        type: "success",
        text: "Contact message deleted successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.detail || "Unable to delete message.",
      });
    }
  };

  const getStatusClass = (status) => {
    return status?.toLowerCase() || "new";
  };

  const newCount = messages.filter((item) => item.status === "New").length;
  const readCount = messages.filter((item) => item.status === "Read").length;
  const repliedCount = messages.filter(
    (item) => item.status === "Replied"
  ).length;

  return (
    <div className="admin-contact-page">
      <div className="admin-contact-header">
        <div>
          <span className="admin-contact-eyebrow">CUSTOMER SUPPORT</span>
          <h1>Contact Messages</h1>
          <p>Manage enquiries and communicate with your customers.</p>
        </div>

        <button
          className="contact-refresh-btn"
          onClick={fetchMessages}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {notice.text && (
        <div className={`contact-notice ${notice.type}`}>
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {notice.text}
          <button onClick={() => setNotice({ type: "", text: "" })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="contact-stats-grid">
        <div className="contact-stat-card">
          <span>Total Messages</span>
          <h2>{messages.length}</h2>
          <Mail size={22} />
        </div>

        <div className="contact-stat-card">
          <span>New Messages</span>
          <h2>{newCount}</h2>
          <MessageSquare size={22} />
        </div>

        <div className="contact-stat-card">
          <span>Read Messages</span>
          <h2>{readCount}</h2>
          <Eye size={22} />
        </div>

        <div className="contact-stat-card">
          <span>Replied Messages</span>
          <h2>{repliedCount}</h2>
          <CheckCircle2 size={22} />
        </div>
      </div>

      <div className="contact-messages-card">
        <div className="contact-toolbar">
          <div>
            <h2>Customer Enquiries</h2>
            <p>View and manage all customer messages.</p>
          </div>

          <div className="contact-filters">
            <div className="contact-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search name, email, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Read">Read</option>
              <option value="Replied">Replied</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="contact-loading">
            <RefreshCw className="contact-spin" size={25} />
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="contact-empty">
            <Mail size={42} />
            <h3>No messages found</h3>
            <p>Customer enquiries will appear here.</p>
          </div>
        ) : (
          <div className="contact-table-wrapper">
            <table className="contact-messages-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {messages.map((message) => (
                  <tr key={message.id}>
                    <td>
                      <div className="contact-customer-cell">
                        <div className="contact-avatar">
                          {message.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <strong>{message.name}</strong>
                          <small>{message.email}</small>
                        </div>
                      </div>
                    </td>

                    <td>{message.subject}</td>
                    <td>{message.phone || "—"}</td>

                    <td>
                      {new Date(message.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <span
                        className={`contact-status ${getStatusClass(
                          message.status
                        )}`}
                      >
                        {message.status}
                      </span>
                    </td>

                    <td>
                      <div className="contact-action-buttons">
                        <button
                          className="contact-view-btn"
                          title="View message"
                          onClick={() => openMessage(message.id)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="contact-delete-btn"
                          title="Delete message"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMessage && (
        <div
          className="contact-modal-overlay"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="contact-message-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="contact-modal-header">
              <div>
                <span>CUSTOMER ENQUIRY</span>
                <h2>Message Details</h2>
              </div>

              <button onClick={() => setSelectedMessage(null)}>
                <X size={21} />
              </button>
            </div>

            <div className="contact-modal-body">
              <div className="contact-detail-grid">
                <div>
                  <label>Customer Name</label>
                  <p>{selectedMessage.name}</p>
                </div>

                <div>
                  <label>Email Address</label>
                  <p>{selectedMessage.email}</p>
                </div>

                <div>
                  <label>Phone Number</label>
                  <p>{selectedMessage.phone || "Not provided"}</p>
                </div>

                <div>
                  <label>Submitted On</label>
                  <p>
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="contact-original-message">
                <label>Subject</label>
                <h3>{selectedMessage.subject}</h3>

                <label>Customer Message</label>
                <p>{selectedMessage.message}</p>
              </div>

              <div className="contact-admin-field">
                <label>Message Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Read">Read</option>
                  <option value="Replied">Replied</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="contact-admin-field">
                <label>Admin Reply</label>
                <textarea
                  rows="5"
                  placeholder="Write your reply to the customer..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>
            </div>

            <div className="contact-modal-footer">
              <button
                className="contact-modal-cancel"
                onClick={() => setSelectedMessage(null)}
              >
                Cancel
              </button>

              <button
                className="contact-modal-save"
                onClick={updateMessage}
                disabled={saving}
              >
                <Send size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
