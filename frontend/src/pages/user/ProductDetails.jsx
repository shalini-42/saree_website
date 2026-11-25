import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
  AlertCircle,
  Heart,
  Star,
  Send,
  Edit2,
  Trash2,
  ImagePlus,
  Camera,
  ThumbsUp,
} from "lucide-react";

import publicApi from "../../services/publicApi";
import customerApi from "../../services/customerApi";

import "./ProductDetails.css";

const BACKEND_URL = "http://127.0.0.1:8000";
const MAX_REVIEW_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function getImageUrl(value) {
  if (!value) return "";

  const image =
    typeof value === "object"
      ? value.image || value.image_url || value.url
      : value;

  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${BACKEND_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.reviews)) return data.reviews;
  return [];
}

function getProductImages(product) {
  if (!product) return [];

  const images = [];

  if (product.primary_image) images.push(product.primary_image);
  if (Array.isArray(product.images)) images.push(...product.images);
  if (product.product_image) images.push(product.product_image);
  if (product.image) images.push(product.image);
  if (product.thumbnail) images.push(product.thumbnail);

  const unique = [];
  const seen = new Set();

  images.forEach((item) => {
    const url = getImageUrl(item);

    if (url && !seen.has(url)) {
      seen.add(url);
      unique.push(url);
    }
  });

  return unique;
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function getReviewCustomerName(review) {
  return (
    review.customer_name ||
    review.username ||
    review.customer_username ||
    "Customer"
  );
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;

  if (Array.isArray(data?.non_field_errors)) {
    return data.non_field_errors[0];
  }

  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const firstValue = data[firstKey];

    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }

  return fallback;
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reviewImageInput = useRef(null);

  // PRODUCT
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // REVIEWS
  const [reviews, setReviews] = useState([]);
  const [ownReview, setOwnReview] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSort, setReviewSort] = useState("newest");

  // PRODUCT GALLERY
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // CART AND WISHLIST
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // DIALOG
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  // REVIEW FORM
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteReviewId, setDeleteReviewId] = useState(null);
  const [reviewError, setReviewError] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("customer_access"));

  // PRODUCT DERIVED DATA
  const images = useMemo(
    () => getProductImages(product),
    [product]
  );

  const productName = product?.name || product?.title || "Saree";

  const price = Number(product?.price || 0);
  const discountPrice = Number(product?.discount_price || 0);

  const hasDiscount =
    discountPrice > 0 && discountPrice < price;

  const finalPrice = hasDiscount ? discountPrice : price;

  const discountPercentage = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const stock = Number(product?.stock || 0);

  // RATING SUMMARY
  const averageRating = useMemo(() => {
    if (reviewSummary?.average_rating !== undefined) {
      return Number(reviewSummary.average_rating || 0);
    }

    if (!reviews.length) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews, reviewSummary]);

  const totalReviews = Number(
    reviewSummary?.total_reviews ?? reviews.length
  );

  const ratingCounts = useMemo(() => {
    const counts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (reviewSummary?.rating_breakdown) {
      [5, 4, 3, 2, 1].forEach((rating) => {
        counts[rating] = Number(
          reviewSummary.rating_breakdown[rating] || 0
        );
      });

      return counts;
    }

    reviews.forEach((review) => {
      const rating = Number(review.rating);

      if (counts[rating] !== undefined) {
        counts[rating] += 1;
      }
    });

    return counts;
  }, [reviews, reviewSummary]);

  const ratingPercentage = (rating) => {
    if (!totalReviews) return 0;

    return (ratingCounts[rating] / totalReviews) * 100;
  };

  // CUSTOMER'S OWN REVIEW
  const myReview = ownReview;

  // SHOW PENDING REVIEW ONLY TO ITS OWNER
  const displayReviews = useMemo(() => {
    if (!myReview || myReview.is_approved) {
      return reviews;
    }

    const alreadyExists = reviews.some(
      (review) => String(review.id) === String(myReview.id)
    );

    return alreadyExists
      ? reviews
      : [...reviews, myReview];
  }, [reviews, myReview]);

  // SORT REVIEWS
  const sortedReviews = useMemo(() => {
    const result = [...displayReviews];

    if (reviewSort === "highest") {
      result.sort(
        (a, b) => Number(b.rating) - Number(a.rating)
      );
    } else if (reviewSort === "lowest") {
      result.sort(
        (a, b) => Number(a.rating) - Number(b.rating)
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    return result;
  }, [displayReviews, reviewSort]);

  // APPROVED CUSTOMER PHOTOS
  const customerPhotos = useMemo(() => {
    return reviews
      .filter(
        (review) =>
          review.is_approved === true &&
          Array.isArray(review.images) &&
          review.images.length > 0
      )
      .flatMap((review) =>
        review.images.map((image, index) => ({
          ...image,
          reviewId: review.id,
          customerName: getReviewCustomerName(review),
          rating: review.rating,
          imageIndex: index,
        }))
      );
  }, [reviews]);

  // DIALOG HELPERS
  const showDialog = (title, message, type = "success") => {
    setDialog({
      open: true,
      title,
      message,
      type,
    });
  };

  const closeDialog = () => {
    setDialog({
      open: false,
      title: "",
      message: "",
      type: "success",
    });
  };

  // FETCH PRODUCT
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await publicApi.get(`products/${id}/`);

      setProduct(response.data);
    } catch (error) {
      console.error("Product loading error:", error);

      setPageError(
        getErrorMessage(
          error,
          "Unable to load this product. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH REVIEWS
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);

      const hasCustomerToken = Boolean(
        localStorage.getItem("customer_access")
      );

      const response = hasCustomerToken
        ? await customerApi.get(`reviews/products/${id}/`)
        : await publicApi.get(`reviews/products/${id}/`);

      const data = response.data;

      const publicReviews = getList(data).filter(
        (review) => review.is_approved === true
      );

      setReviews(publicReviews);
      setOwnReview(data?.my_review || null);
      setReviewSummary(data?.summary || null);
    } catch (error) {
      console.error("Review loading error:", error);
      console.error("Review API response:", error.response?.data);

      setReviews([]);
      setOwnReview(null);
      setReviewSummary(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);

    setReviewRating(0);
    setReviewTitle("");
    setReviewComment("");
    setReviewImages([]);
    setEditingReview(null);
    setReviewError("");
    setOwnReview(null);
    setReviewSummary(null);

    if (reviewImageInput.current) {
      reviewImageInput.current.value = "";
    }
  }, [id]);

  // PRODUCT IMAGE NAVIGATION
  const handlePreviousImage = () => {
    if (!images.length) return;

    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const handleNextImage = () => {
    if (!images.length) return;

    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  // QUANTITY
  const handleQuantity = (type) => {
    setQuantity((current) => {
      if (type === "minus") {
        return Math.max(1, current - 1);
      }

      return Math.min(stock || 1, current + 1);
    });
  };

  // ADD TO CART
  const handleAddToCart = async () => {
    if (!localStorage.getItem("customer_access")) {
      showDialog(
        "Login Required",
        "Please log in to add this saree to your shopping bag.",
        "error"
      );

      setTimeout(() => navigate("/customer/login"), 1200);
      return;
    }

    if (stock <= 0) {
      showDialog(
        "Out of Stock",
        "This saree is currently unavailable.",
        "error"
      );
      return;
    }

    try {
      setCartLoading(true);

      await customerApi.post("cart/add/", {
        product_id: product.id,
        quantity,
      });

      window.dispatchEvent(
        new Event("customerCartChanged")
      );

      showDialog(
        "A Beautiful Choice!",
        `${productName} has been added to your shopping bag.`,
        "success"
      );
    } catch (error) {
      console.error("Add to cart error:", error);

      showDialog(
        "Unable to Add Item",
        getErrorMessage(
          error,
          "Something went wrong while adding this item."
        ),
        "error"
      );
    } finally {
      setCartLoading(false);
    }
  };

  // WISHLIST
  const handleWishlist = async () => {
    if (!localStorage.getItem("customer_access")) {
      showDialog(
        "Login Required",
        "Please log in to save your favourite sarees.",
        "error"
      );

      setTimeout(() => navigate("/customer/login"), 1200);
      return;
    }

    try {
      setWishlistLoading(true);

      if (isWishlisted) {
        await customerApi.delete(
          `customer/wishlist/${product.id}/`
        );

        setIsWishlisted(false);
      } else {
        await customerApi.post("customer/wishlist/", {
          product_id: product.id,
        });

        setIsWishlisted(true);
      }

      window.dispatchEvent(
        new Event("customerWishlistChanged")
      );
    } catch (error) {
      console.error("Wishlist error:", error);

      showDialog(
        "Unable to Update Wishlist",
        getErrorMessage(error, "Please try again."),
        "error"
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  // REVIEW FORM RESET
  const resetReviewForm = () => {
    setReviewRating(0);
    setReviewTitle("");
    setReviewComment("");
    setReviewImages([]);
    setEditingReview(null);
    setReviewError("");

    if (reviewImageInput.current) {
      reviewImageInput.current.value = "";
    }
  };

  // EDIT REVIEW
  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewRating(Number(review.rating || 0));
    setReviewTitle(review.title || "");
    setReviewComment(review.comment || "");
    setReviewImages([]);
    setReviewError("");

    if (reviewImageInput.current) {
      reviewImageInput.current.value = "";
    }

    document.getElementById("pd-review-form")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // REVIEW IMAGE SELECTION
  const handleReviewImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setReviewError("");

    if (selectedFiles.length > MAX_REVIEW_IMAGES) {
      setReviewError(
        `You can select a maximum of ${MAX_REVIEW_IMAGES} images at a time.`
      );

      event.target.value = "";
      return;
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setReviewError("Please select valid image files only.");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setReviewError(
          `${file.name} exceeds the maximum image size of 5 MB.`
        );

        event.target.value = "";
        return;
      }
    }

    setReviewImages(selectedFiles);
  };

  // REVIEW SUBMISSION / UPDATE
  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewError("");

    if (!localStorage.getItem("customer_access")) {
      setReviewError("Please log in to submit a review.");
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Please select a star rating.");
      return;
    }

    if (reviewTitle.trim().length > 150) {
      setReviewError("Review title cannot exceed 150 characters.");
      return;
    }

    if (reviewComment.trim().length > 2000) {
      setReviewError("Your review cannot exceed 2000 characters.");
      return;
    }

    if (reviewImages.length > MAX_REVIEW_IMAGES) {
      setReviewError("You can upload a maximum of 5 images.");
      return;
    }

    try {
      setReviewSubmitting(true);

      const formData = new FormData();

      formData.append("rating", reviewRating);
      formData.append("title", reviewTitle.trim());
      formData.append("comment", reviewComment.trim());

      reviewImages.forEach((image) => {
        formData.append("images", image);
      });

      const existingReview = editingReview || myReview;

      if (existingReview) {
        await customerApi.patch(
          `reviews/${existingReview.id}/`,
          formData
        );

        resetReviewForm();
        await fetchReviews();

        showDialog(
          "Review Updated",
          "Your review has been updated successfully and is waiting for approval.",
          "success"
        );
      } else {
        await customerApi.post(
          `reviews/products/${id}/`,
          formData
        );

        resetReviewForm();
        await fetchReviews();

        showDialog(
          "Thank You!",
          "Your review has been submitted successfully and is waiting for approval.",
          "success"
        );
      }
    } catch (error) {
      console.error("Review submit error:", error);
      console.error(
        "Backend validation response:",
        error.response?.data
      );

      setReviewError(
        getErrorMessage(
          error,
          "Unable to submit your review. Please try again."
        )
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // DELETE REVIEW
  const handleDeleteReview = async () => {
    if (!deleteReviewId) return;

    try {
      await customerApi.delete(
        `reviews/${deleteReviewId}/`
      );

      setDeleteReviewId(null);
      resetReviewForm();

      await fetchReviews();

      showDialog(
        "Review Deleted",
        "Your review has been deleted successfully.",
        "success"
      );
    } catch (error) {
      console.error("Delete review error:", error);

      setDeleteReviewId(null);

      showDialog(
        "Unable to Delete",
        getErrorMessage(
          error,
          "Please try again later."
        ),
        "error"
      );
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-loader" />
        <p>Preparing something beautiful...</p>
      </div>
    );
  }

  // ERROR
  if (pageError || !product) {
    return (
      <div className="pd-error-page">
        <AlertCircle size={38} />
        <h2>Product Unavailable</h2>
        <p>
          {pageError || "This product could not be found."}
        </p>

        <Link to="/shop" className="pd-primary-button">
          Back to Collection
        </Link>
      </div>
    );
  }

  return (
    <main className="product-details-page">
      <div className="pd-container">

        <Link to="/shop" className="pd-back-link">
          <ArrowLeft size={17} />
          <span>Back to Collection</span>
        </Link>

        <section className="pd-product-layout">

          {/* PRODUCT GALLERY */}
          <div className="pd-gallery">
            <div className="pd-main-image">
              {images.length > 0 ? (
                <img
                  src={images[activeImage] || images[0]}
                  alt={productName}
                />
              ) : (
                <div className="pd-no-image">
                  <ShoppingBag size={48} />
                  <span>Image coming soon</span>
                </div>
              )}

              {hasDiscount && (
                <span className="pd-discount-badge">
                  {discountPercentage}% OFF
                </span>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pd-image-arrow pd-image-prev"
                    onClick={handlePreviousImage}
                    aria-label="Previous image"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <button
                    type="button"
                    className="pd-image-arrow pd-image-next"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ArrowRight size={19} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="pd-thumbnail-list">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={`pd-thumbnail ${
                      activeImage === index ? "active" : ""
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img
                      src={image}
                      alt={`${productName} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="pd-product-info">

            <div className="pd-brand-label">
              SĀRIKA LUXURY BOUTIQUE
            </div>

            <h1>{productName}</h1>

            <div className="pd-rating-short">
              <div className="pd-rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={
                      star <= Math.round(averageRating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>

              <a href="#reviews">
                {averageRating.toFixed(1)} ({totalReviews} reviews)
              </a>
            </div>

            <div className="pd-price-area">
              <span className="pd-current-price">
                ₹{formatPrice(finalPrice)}
              </span>

              {hasDiscount && (
                <>
                  <span className="pd-old-price">
                    ₹{formatPrice(price)}
                  </span>

                  <span className="pd-save-label">
                    Save {discountPercentage}%
                  </span>
                </>
              )}
            </div>

            <p className="pd-description">
              {product.description ||
                product.desc ||
                "Discover timeless elegance with this beautiful saree from SĀRIKA."}
            </p>

            <div className="pd-stock-line">
              <span
                className={
                  stock > 0 ? "pd-in-stock" : "pd-out-stock"
                }
              >
                {stock > 0 ? "In Stock" : "Out of Stock"}
              </span>

              {stock > 0 && (
                <span>{stock} pieces available</span>
              )}
            </div>

            <div className="pd-quantity-row">
              <span>Quantity</span>

              <div className="pd-quantity-control">
                <button
                  type="button"
                  onClick={() => handleQuantity("minus")}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  onClick={() => handleQuantity("plus")}
                  disabled={quantity >= stock}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <div className="pd-action-buttons">
              <button
                type="button"
                className="pd-add-cart"
                onClick={handleAddToCart}
                disabled={cartLoading || stock <= 0}
              >
                <ShoppingBag size={18} />
                {cartLoading ? "Adding..." : "Add to Bag"}
              </button>

              <button
                type="button"
                className={`pd-wishlist-button ${
                  isWishlisted ? "wishlisted" : ""
                }`}
                onClick={handleWishlist}
                disabled={wishlistLoading}
                aria-label="Toggle wishlist"
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              </button>
            </div>

            <div className="pd-benefits">
              <div>
                <Truck size={21} />
                <span>Reliable Delivery</span>
              </div>

              <div>
                <ShieldCheck size={21} />
                <span>Quality Assured</span>
              </div>

              <div>
                <RotateCcw size={21} />
                <span>Easy Return Request</span>
              </div>
            </div>

            <div className="pd-product-specifications">
              <h3>Product Details</h3>

              {[
                ["Category", product.category_name || product.category],
                ["Fabric", product.fabric],
                ["Colour", product.colour],
                ["Occasion", product.occasion],
                ["SKU", product.sku],
              ]
                .filter((item) => item[1])
                .map(([label, value]) => (
                  <div className="pd-spec-row" key={label}>
                    <span>{label}</span>

                    <strong>
                      {typeof value === "object"
                        ? value.name || value.title || ""
                        : value}
                    </strong>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* CUSTOMER REVIEWS */}
        <section className="pd-reviews-section" id="reviews">

          <div className="pd-section-heading">
            <span>LOVE FROM OUR CUSTOMERS</span>
            <h2>Customer Reviews</h2>
            <p>
              Real experiences from our SĀRIKA customers
            </p>
          </div>

          {/* RATING SUMMARY */}
          <div className="pd-rating-summary">

            <div className="pd-rating-overview">
              <strong>{averageRating.toFixed(1)}</strong>

              <div className="pd-rating-stars large">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={19}
                    fill={
                      star <= Math.round(averageRating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>

              <span>
                Based on {totalReviews} customer reviews
              </span>
            </div>

            <div className="pd-rating-bars">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div
                  className="pd-rating-bar-row"
                  key={rating}
                >
                  <span>{rating} star</span>

                  <div className="pd-rating-bar-track">
                    <div
                      className="pd-rating-bar-fill"
                      style={{
                        width: `${ratingPercentage(rating)}%`,
                      }}
                    />
                  </div>

                  <span className="pd-rating-count">
                    {ratingCounts[rating]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CUSTOMER PHOTO GALLERY */}
          {customerPhotos.length > 0 && (
            <div className="pd-customer-photo-gallery">
              <div className="pd-photo-gallery-heading">
                <span>
                  <Camera size={15} />
                  REAL CUSTOMER EXPERIENCES
                </span>

                <h3>See It on Our Customers</h3>

                <p>
                  Explore saree photos shared by customers who purchased this product.
                </p>
              </div>

              <div className="pd-photo-gallery-grid">
                {customerPhotos.map((image) => (
                  <a
                    key={`${image.reviewId}-${image.id || image.imageIndex}`}
                    href={getImageUrl(image)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pd-customer-photo-item"
                    title="View customer photo"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Saree photo shared by ${image.customerName}`}
                      loading="lazy"
                    />

                    <div className="pd-customer-photo-info">
                      <strong>{image.customerName}</strong>

                      <span>
                        <Star size={12} fill="currentColor" />
                        {image.rating}/5
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* REVIEW FORM */}
          <div
            className="pd-review-form-card"
            id="pd-review-form"
          >
            <div className="pd-review-form-heading">
              <div>
                <span>SHARE YOUR EXPERIENCE</span>

                <h3>
                  {editingReview
                    ? "Edit Your Review"
                    : "Write a Review"}
                </h3>
              </div>

              <Sparkles size={25} />
            </div>

            {myReview && !editingReview && (
              <div className="pd-existing-review-note">
                <CheckCircle2 size={17} />

                <span>
                  You have already reviewed this product.
                  You can edit your review below.
                </span>

                <button
                  type="button"
                  onClick={() => handleEditReview(myReview)}
                >
                  Edit Review
                </button>
              </div>
            )}

            {!isLoggedIn && (
              <div className="pd-existing-review-note">
                <AlertCircle size={17} />

                <span>
                  Please log in to share your product review.
                  Reviews are available after your order is delivered.
                </span>

                <Link to="/customer/login">
                  Login
                </Link>
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>

              <label className="pd-form-label">
                Your Rating <span>*</span>
              </label>

              <div className="pd-review-star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={
                      star <= reviewRating ? "active" : ""
                    }
                    onClick={() => setReviewRating(star)}
                    aria-label={`Select ${star} star${star > 1 ? "s" : ""}`}
                    aria-pressed={reviewRating === star}
                  >
                    <Star
                      size={29}
                      fill={
                        star <= reviewRating
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                ))}

                <span className="pd-selected-rating">
                  {reviewRating === 0
                    ? "Select your rating"
                    : `${reviewRating} out of 5`}
                </span>
              </div>

              <label
                className="pd-form-label"
                htmlFor="pd-review-title"
              >
                Review Title
              </label>

              <input
                id="pd-review-title"
                type="text"
                value={reviewTitle}
                onChange={(event) =>
                  setReviewTitle(event.target.value)
                }
                placeholder="Give your review a title..."
                maxLength={150}
              />

              <div className="pd-review-character-count">
                {reviewTitle.length}/150
              </div>

              <label
                className="pd-form-label"
                htmlFor="pd-review-comment"
              >
                Your Review
              </label>

              <textarea
                id="pd-review-comment"
                value={reviewComment}
                onChange={(event) =>
                  setReviewComment(event.target.value)
                }
                placeholder="Share your experience with this saree..."
                maxLength={2000}
                rows={5}
              />

              <div className="pd-review-character-count">
                {reviewComment.length}/2000
              </div>

              {/* REVIEW PHOTO UPLOAD */}
              <div className="pd-review-upload-section">
                <label className="pd-form-label">
                  Add Photos
                </label>

                <p>
                  Share photos of your saree. Maximum 5 images,
                  5 MB each.
                </p>

                <label
                  className="pd-review-upload-button"
                  htmlFor="pd-review-images"
                >
                  <ImagePlus size={19} />
                  Choose Photos
                </label>

                <input
                  ref={reviewImageInput}
                  id="pd-review-images"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleReviewImageChange}
                />

                {reviewImages.length > 0 && (
                  <div className="pd-selected-review-files">
                    {reviewImages.map((file, index) => (
                      <div
                        className="pd-selected-review-file"
                        key={`${file.name}-${index}`}
                      >
                        <span>{file.name}</span>

                        <button
                          type="button"
                          onClick={() => {
                            setReviewImages((current) =>
                              current.filter(
                                (_, fileIndex) => fileIndex !== index
                              )
                            );

                            if (reviewImageInput.current) {
                              reviewImageInput.current.value = "";
                            }
                          }}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {editingReview &&
                  Array.isArray(editingReview.images) &&
                  editingReview.images.length > 0 && (
                    <div className="pd-existing-review-images">
                      <span>Previously uploaded photos</span>

                      <div className="pd-customer-review-images">
                        {editingReview.images.map((image, index) => (
                          <img
                            key={image.id || index}
                            src={getImageUrl(image)}
                            alt="Previously uploaded review"
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {reviewError && (
                <div className="pd-review-error">
                  <AlertCircle size={16} />
                  {reviewError}
                </div>
              )}

              <div className="pd-review-form-actions">
                <button
                  type="submit"
                  className="pd-submit-review"
                  disabled={reviewSubmitting || !isLoggedIn}
                >
                  <Send size={16} />

                  {reviewSubmitting
                    ? "Submitting..."
                    : editingReview
                      ? "Update Review"
                      : "Submit Review"}
                </button>

                {editingReview && (
                  <button
                    type="button"
                    className="pd-cancel-review"
                    onClick={resetReviewForm}
                    disabled={reviewSubmitting}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* REVIEW LIST */}
          <div className="pd-review-list">

            <div className="pd-review-list-heading">
              <h3>What Customers Say</h3>

              <div className="pd-review-list-controls">
                <span>{displayReviews.length} reviews</span>

                <select
                  value={reviewSort}
                  onChange={(event) =>
                    setReviewSort(event.target.value)
                  }
                  aria-label="Sort reviews"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="pd-review-empty">
                <div className="pd-small-loader" />
                Loading customer reviews...
              </div>
            ) : displayReviews.length === 0 ? (
              <div className="pd-review-empty">
                <div className="pd-empty-star">
                  <Star size={27} />
                </div>

                <h4>No Reviews Yet</h4>

                <p>
                  Be the first to share your experience
                  with this beautiful saree.
                </p>
              </div>
            ) : (
              sortedReviews.map((review) => (
                <article
                  className="pd-review-card"
                  key={review.id}
                >
                  <div className="pd-review-card-top">

                    <div className="pd-review-avatar">
                      {getReviewCustomerName(review)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="pd-review-customer">
                      <strong>
                        {getReviewCustomerName(review)}
                      </strong>

                      {review.is_verified_purchase && (
                        <span className="pd-verified-label">
                          <ShieldCheck size={13} />
                          Verified Purchase
                        </span>
                      )}

                      {review.is_approved === false && (
                        <span className="pd-pending-label">
                          Pending Approval
                        </span>
                      )}
                    </div>

                    <div className="pd-review-date">
                      {formatDate(review.created_at)}
                    </div>
                  </div>

                  <div className="pd-review-card-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={
                          star <= Number(review.rating)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>

                  {review.title && (
                    <h4 className="pd-review-title">
                      {review.title}
                    </h4>
                  )}

                  {review.comment && (
                    <p className="pd-review-comment">
                      {review.comment}
                    </p>
                  )}

                  {Array.isArray(review.images) &&
                    review.images.length > 0 && (
                      <div className="pd-customer-review-images">
                        {review.images.map((image, index) => (
                          <a
                            key={image.id || index}
                            href={getImageUrl(image)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getImageUrl(image)}
                              alt="Customer saree review"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                  {Number(review.helpful_count || 0) > 0 && (
                    <div className="pd-review-helpful-count">
                      <ThumbsUp size={14} />
                      {review.helpful_count} found this helpful
                    </div>
                  )}

                  {/* ONLY THE OWNER CAN EDIT OR DELETE */}
                  {myReview &&
                    String(myReview.id) === String(review.id) && (
                      <div className="pd-review-management">
                        <button
                          type="button"
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteReviewId(review.id)
                          }
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* LUXURY SUCCESS / ERROR DIALOG */}
      {dialog.open && (
        <div
          className="pd-dialog-overlay"
          onClick={closeDialog}
        >
          <div
            className="pd-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="pd-dialog-close"
              onClick={closeDialog}
              aria-label="Close dialog"
            >
              <X size={19} />
            </button>

            <div
              className={`pd-dialog-icon ${
                dialog.type === "error" ? "error" : ""
              }`}
            >
              {dialog.type === "error" ? (
                <AlertCircle size={30} />
              ) : (
                <CheckCircle2 size={30} />
              )}
            </div>

            <span className="pd-dialog-brand">
              SĀRIKA
            </span>

            <h3>{dialog.title}</h3>
            <p>{dialog.message}</p>

            <button
              type="button"
              className="pd-dialog-button"
              onClick={closeDialog}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION */}
      {deleteReviewId && (
        <div
          className="pd-dialog-overlay"
          onClick={() => setDeleteReviewId(null)}
        >
          <div
            className="pd-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="pd-dialog-close"
              onClick={() => setDeleteReviewId(null)}
              aria-label="Close dialog"
            >
              <X size={19} />
            </button>

            <div className="pd-dialog-icon error">
              <Trash2 size={28} />
            </div>

            <span className="pd-dialog-brand">
              SĀRIKA
            </span>

            <h3>Delete Your Review?</h3>

            <p>
              Are you sure you want to delete this review?
              This action cannot be undone.
            </p>

            <div className="pd-confirm-actions">
              <button
                type="button"
                className="pd-confirm-delete"
                onClick={handleDeleteReview}
              >
                Yes, Delete
              </button>

              <button
                type="button"
                className="pd-confirm-cancel"
                onClick={() => setDeleteReviewId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}