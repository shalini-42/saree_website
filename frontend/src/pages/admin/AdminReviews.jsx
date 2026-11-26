
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Star,
  MessageSquare,
  Trash2,
  Eye,
  X,
  Filter,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  ThumbsUp,
  Clock,
  Check,
  XCircle,
} from "lucide-react";

import api from "../../services/api.js";
import "./AdminReviews.css";

const BACKEND_URL = "https://saree-website-backend-seven.vercel.app";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [approval, setApproval] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedReview, setSelectedReview] = useState(null);
  const [deleteReview, setDeleteReview] = useState(null);

  const [message, setMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const params = {};

      if (search.trim()) params.search = search.trim();
      if (rating) params.rating = rating;
      if (approval) params.status = approval;

      const response = await api.get("reviews/admin/", { params });

      // Django API response: { count, reviews: [] }
      const reviewList = Array.isArray(response.data?.reviews)
        ? response.data.reviews
        : Array.isArray(response.data)
          ? response.data
          : [];

      setReviews(reviewList);

      // Keep selected review synchronized after refresh.
      if (selectedReview) {
        const updated = reviewList.find(
          (item) => item.id === selectedReview.id
        );

        setSelectedReview(updated || null);
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);

      setMessage({
        type: "error",
        title: "Unable to Load Reviews",
        text:
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "Something went wrong while loading reviews.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [search, rating, approval]);

  const statistics = useMemo(() => {
    const total = reviews.length;

    const approvedReviews = reviews.filter(
      (item) => item.is_approved === true
    );

    const pendingReviews = reviews.filter(
      (item) => item.is_approved === false
    );

    const average = total
      ? (
          reviews.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0
          ) / total
        ).toFixed(1)
      : "0.0";

    return {
      total,
      average,
      approved: approvedReviews.length,
      pending: pendingReviews.length,
      fiveStar: reviews.filter(
        (item) => Number(item.rating) === 5
      ).length,
      lowRating: reviews.filter(
        (item) => Number(item.rating) <= 2
      ).length,
    };
  }, [reviews]);

  const handleApproval = async (review, approved) => {
    try {
      setProcessingId(review.id);

      const response = await api.patch(
        `reviews/admin/${review.id}/`,
        { is_approved: approved }
      );

      const updatedReview = response.data?.review || {
        ...review,
        is_approved: approved,
      };

      setReviews((previous) =>
        previous.map((item) =>
          item.id === review.id
            ? { ...item, ...updatedReview }
            : item
        )
      );

      setSelectedReview((previous) =>
        previous?.id === review.id
          ? { ...previous, ...updatedReview }
          : previous
      );

      setMessage({
        type: "success",
        title: approved ? "Review Approved" : "Review Rejected",
        text: approved
          ? "The customer review is now published and can contribute to the product rating."
          : "The customer review has been unpublished.",
      });

      // If a status filter is active, refresh to reflect the change.
      if (approval) {
        await fetchReviews();
      }
    } catch (error) {
      console.error("Review approval error:", error);

      setMessage({
        type: "error",
        title: "Update Failed",
        text:
          error.response?.data?.error ||
          error.response?.data?.detail ||
          "Unable to update review status.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteReview) return;

    try {
      setDeleting(true);

      await api.delete(`reviews/admin/${deleteReview.id}/`);

      setReviews((previous) =>
        previous.filter((item) => item.id !== deleteReview.id)
      );

      setDeleteReview(null);
      setSelectedReview(null);

      setMessage({
        type: "success",
        title: "Review Deleted",
        text: "The customer review has been successfully removed.",
      });
    } catch (error) {
      console.error("Delete review error:", error);

      setMessage({
        type: "error",
        title: "Delete Failed",
        text:
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "Unable to delete this review. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderStars = (value) => (
    <span className="ar-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
          fill={star <= Number(value) ? "currentColor" : "none"}
        />
      ))}
    </span>
  );

  const getImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${BACKEND_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  const getStatus = (review) => {
    return review.is_approved
      ? { label: "Approved", className: "approved" }
      : { label: "Pending", className: "pending" };
  };

  return (
    <div className="admin-reviews">

      {/* PAGE HEADER */}
      <div className="ar-heading">
        <div>
          <span className="ar-eyebrow">CUSTOMER EXPERIENCE</span>
          <h1>Reviews & Ratings</h1>
          <p>Manage customer feedback, ratings and product reviews.</p>
        </div>

        <button
          className="ar-refresh"
          onClick={fetchReviews}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "ar-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* STATISTICS */}
      <div className="ar-stats">

        <div className="ar-stat-card">
          <span className="ar-stat-icon">
            <MessageSquare />
          </span>
          <div>
            <p>Total Reviews</p>
            <h2>{statistics.total}</h2>
          </div>
        </div>

        <div className="ar-stat-card">
          <span className="ar-stat-icon">
            <Star />
          </span>
          <div>
            <p>Average Rating</p>
            <h2>{statistics.average} / 5</h2>
          </div>
        </div>

        <div className="ar-stat-card">
          <span className="ar-stat-icon">
            <ShieldCheck />
          </span>
          <div>
            <p>Approved Reviews</p>
            <h2>{statistics.approved}</h2>
          </div>
        </div>

        <div className="ar-stat-card">
          <span className="ar-stat-icon">
            <Clock />
          </span>
          <div>
            <p>Pending Reviews</p>
            <h2>{statistics.pending}</h2>
          </div>
        </div>

      </div>

      {/* SECONDARY STATISTICS */}
      <div className="ar-secondary-stats">
        <div>
          <Star size={16} />
          <span>5-Star Reviews</span>
          <strong>{statistics.fiveStar}</strong>
        </div>

        <div>
          <AlertCircle size={16} />
          <span>Low Ratings (1–2)</span>
          <strong>{statistics.lowRating}</strong>
        </div>
      </div>

      {/* CONTENT */}
      <div className="ar-content">

        {/* FILTER TOOLBAR */}
        <div className="ar-toolbar">

          <div className="ar-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customer, product or comment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="ar-filter">
            <Filter size={17} />
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((item) => (
                <option key={item} value={item}>
                  {item} Stars
                </option>
              ))}
            </select>
          </div>

          <div className="ar-filter">
            <ShieldCheck size={17} />
            <select
              value={approval}
              onChange={(e) => setApproval(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>

        </div>

        {/* REVIEW TABLE */}
        <div className="ar-table-wrap">
          <table className="ar-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7" className="ar-empty">
                    <Loader2 className="ar-spin" size={25} />
                    <p>Loading reviews...</p>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="7" className="ar-empty">
                    <MessageSquare size={32} />
                    <p>No reviews found.</p>
                    <span>Customer reviews will appear here.</span>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => {
                  const reviewStatus = getStatus(review);

                  return (
                    <tr key={review.id}>

                      <td>
                        <strong>
                          {review.customer_name || "Customer"}
                        </strong>

                        {review.is_verified_purchase && (
                          <small className="ar-verified">
                            <ShieldCheck size={12} />
                            Verified
                          </small>
                        )}
                      </td>

                      <td>
                        {review.product_name || "Product"}
                      </td>

                      <td>
                        <div className="ar-rating">
                          {renderStars(review.rating)}
                          <span>{review.rating}/5</span>
                        </div>
                      </td>

                      <td>
                        <div className="ar-review-preview">
                          {review.title && (
                            <strong>{review.title}</strong>
                          )}

                          <span className="ar-comment">
                            {review.comment || "No written comment"}
                          </span>

                          {review.images?.length > 0 && (
                            <small>
                              <ImageIcon size={13} />
                              {review.images.length} photo(s)
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`ar-status ${reviewStatus.className}`}
                        >
                          {review.is_approved ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Clock size={13} />
                          )}
                          {reviewStatus.label}
                        </span>
                      </td>

                      <td>
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="ar-actions">

                          {!review.is_approved ? (
                            <button
                              className="ar-approve-btn"
                              title="Approve review"
                              disabled={processingId === review.id}
                              onClick={() => handleApproval(review, true)}
                            >
                              {processingId === review.id ? (
                                <Loader2 size={16} className="ar-spin" />
                              ) : (
                                <Check size={17} />
                              )}
                            </button>
                          ) : (
                            <button
                              className="ar-reject-btn"
                              title="Reject review"
                              disabled={processingId === review.id}
                              onClick={() => handleApproval(review, false)}
                            >
                              <XCircle size={17} />
                            </button>
                          )}

                          <button
                            title="View review"
                            onClick={() => setSelectedReview(review)}
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            className="ar-delete-btn"
                            title="Delete review"
                            onClick={() => setDeleteReview(review)}
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>

        <div className="ar-footer">
          Showing {reviews.length} review
          {reviews.length !== 1 ? "s" : ""}
        </div>

      </div>

      {/* REVIEW DETAILS MODAL */}
      {selectedReview && (
        <div
          className="ar-overlay"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="ar-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="ar-modal-head">
              <div>
                <span className="ar-eyebrow">CUSTOMER FEEDBACK</span>
                <h2>Review Details</h2>
              </div>

              <button onClick={() => setSelectedReview(null)}>
                <X />
              </button>
            </div>

            <div className="ar-detail">
              <span>Customer</span>
              <strong>
                {selectedReview.customer_name || "Customer"}
              </strong>
            </div>

            <div className="ar-detail">
              <span>Product</span>
              <strong>
                {selectedReview.product_name || "Product"}
              </strong>
            </div>

            <div className="ar-detail">
              <span>Rating</span>
              <div className="ar-rating">
                {renderStars(selectedReview.rating)}
                <strong>{selectedReview.rating}/5</strong>
              </div>
            </div>

            <div className="ar-detail">
              <span>Review Title</span>
              <strong>
                {selectedReview.title || "No title provided"}
              </strong>
            </div>

            <div className="ar-detail">
              <span>Review Comment</span>
              <p>
                {selectedReview.comment || "No written comment."}
              </p>
            </div>

            <div className="ar-detail">
              <span>Purchase Verification</span>
              <strong>
                {selectedReview.is_verified_purchase
                  ? "Verified Purchase"
                  : "Not verified"}
              </strong>
            </div>

            <div className="ar-detail">
              <span>Helpful Votes</span>
              <strong>
                <ThumbsUp size={15} />
                {selectedReview.helpful_count || 0}
              </strong>
            </div>

            <div className="ar-detail">
              <span>Approval Status</span>
              <strong>
                {selectedReview.is_approved ? "Approved" : "Pending"}
              </strong>
            </div>

            <div className="ar-detail">
              <span>Submitted On</span>
              <strong>
                {selectedReview.created_at
                  ? new Date(selectedReview.created_at).toLocaleString()
                  : "—"}
              </strong>
            </div>

            {/* CUSTOMER PHOTOS */}
            {selectedReview.images?.length > 0 && (
              <div className="ar-detail">
                <span>Customer Photos</span>

                <div className="ar-review-images">
                  {selectedReview.images.map((item) => (
                    <a
                      key={item.id}
                      href={getImageUrl(item.image)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt="Customer review"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL ACTIONS */}
            <div className="ar-modal-actions">

              {!selectedReview.is_approved ? (
                <button
                  className="ar-primary-btn"
                  disabled={processingId === selectedReview.id}
                  onClick={() => handleApproval(selectedReview, true)}
                >
                  <CheckCircle2 size={16} />
                  Approve Review
                </button>
              ) : (
                <button
                  className="ar-reject-btn"
                  disabled={processingId === selectedReview.id}
                  onClick={() => handleApproval(selectedReview, false)}
                >
                  <XCircle size={16} />
                  Reject Review
                </button>
              )}

              <button
                className="ar-cancel-btn"
                onClick={() => setSelectedReview(null)}
              >
                Close Details
              </button>

            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteReview && (
        <div className="ar-overlay">
          <div className="ar-confirm-modal">

            <div className="ar-warning-icon">
              <Trash2 size={25} />
            </div>

            <h2>Delete This Review?</h2>

            <p>
              Are you sure you want to permanently delete this customer
              review? This action cannot be undone.
            </p>

            <div className="ar-confirm-actions">

              <button
                className="ar-cancel-btn"
                onClick={() => setDeleteReview(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="ar-danger-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={15} className="ar-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* SUCCESS / ERROR MESSAGE */}
      {message && (
        <div className="ar-overlay ar-message-overlay">
          <div className="ar-message-modal">

            <div className={`ar-message-icon ${message.type}`}>
              {message.type === "success" ? (
                <CheckCircle2 size={30} />
              ) : (
                <AlertCircle size={30} />
              )}
            </div>

            <h2>{message.title}</h2>
            <p>{message.text}</p>

            <button
              className="ar-primary-btn"
              onClick={() => setMessage(null)}
            >
              Continue
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
