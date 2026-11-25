
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImagePlus,
  LoaderCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";

import api from "../../services/api";
import AdminNavbar from "../../components/admin/AdminNavbar";
import "./AdminProductDetails.css";

export default function AdminProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [deletingImage, setDeletingImage] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: "",
    imageId: null,
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    window.setTimeout(() => {
      setToast((previous) => ({ ...previous, show: false }));
    }, 3000);
  };

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(`products/${id}/`);
      const data = response.data;

      setProduct(data);

      const productImages = Array.isArray(data.images)
        ? data.images.filter((item) => item && item.id && item.image)
        : [];

      setImages(productImages);

      const primaryIndex = productImages.findIndex(
        (image) => image.is_primary
      );

      setActiveImage(primaryIndex >= 0 ? primaryIndex : 0);
    } catch (error) {
      console.error(
        "Product loading error:",
        error.response?.data || error
      );
      showToast("Unable to load product details.", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const currentImage = images[activeImage];

  const goToNextImage = () => {
    if (images.length > 1) {
      setActiveImage((previous) => (previous + 1) % images.length);
    }
  };

  const goToPreviousImage = () => {
    if (images.length > 1) {
      setActiveImage(
        (previous) => (previous - 1 + images.length) % images.length
      );
    }
  };

  const openDeleteImageDialog = (imageId) => {
    setDialog({
      open: true,
      type: "image",
      imageId,
    });
  };

  const openDeleteProductDialog = () => {
    setDialog({
      open: true,
      type: "product",
      imageId: null,
    });
  };

  const closeDialog = () => {
    if (deletingImage || deletingProduct) return;

    setDialog({
      open: false,
      type: "",
      imageId: null,
    });
  };

  const handleDeleteImage = async (imageId) => {
    try {
      setDeletingImage(imageId);

      await api.delete(`products/${id}/images/${imageId}/`);

      const updatedImages = images.filter(
        (image) => image.id !== imageId
      );

      setImages(updatedImages);

      if (updatedImages.length === 0) {
        setActiveImage(0);
      } else {
        const nextPrimaryIndex = updatedImages.findIndex(
          (image) => image.is_primary
        );

        setActiveImage(
          nextPrimaryIndex >= 0
            ? nextPrimaryIndex
            : Math.min(activeImage, updatedImages.length - 1)
        );
      }

      setDialog({
        open: false,
        type: "",
        imageId: null,
      });

      showToast("Product image deleted successfully.");
    } catch (error) {
      console.error(
        "Image deletion error:",
        error.response?.data || error
      );

      setDialog({
        open: false,
        type: "",
        imageId: null,
      });

      showToast(
        error.response?.data?.error || "Unable to delete this image.",
        "error"
      );
    } finally {
      setDeletingImage(null);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setDeletingProduct(true);

      await api.delete(`products/${id}/`);

      setDialog({
        open: false,
        type: "",
        imageId: null,
      });

      showToast("Product deleted successfully.");

      window.setTimeout(() => {
        navigate("/admin/products");
      }, 900);
    } catch (error) {
      console.error(
        "Product deletion error:",
        error.response?.data || error
      );

      setDialog({
        open: false,
        type: "",
        imageId: null,
      });

      showToast("Unable to delete this product.", "error");
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleConfirm = () => {
    if (dialog.type === "image" && dialog.imageId) {
      handleDeleteImage(dialog.imageId);
    }

    if (dialog.type === "product") {
      handleDeleteProduct();
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "—";
    }

    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  const categoryName =
    typeof product?.category === "object"
      ? product?.category?.name || product?.category?.title
      : product?.category_name || product?.category || "—";

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="apd-loading">
          <LoaderCircle className="apd-spinner" size={36} />
          <p>Preparing your product details...</p>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <AdminNavbar />
        <div className="apd-empty">
          <Package size={42} />
          <h2>Product not found</h2>
          <p>The requested product could not be found.</p>
          <button onClick={() => navigate("/admin/products")}>
            <ArrowLeft size={17} />
            Back to Products
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />

      <main className="apd-page">
        <div className="apd-container">

          {/* Header */}
          <div className="apd-topbar">
            <button
              type="button"
              className="apd-back"
              onClick={() => navigate("/admin/products")}
            >
              <ArrowLeft size={17} />
              Back to Collection
            </button>

            <div className="apd-breadcrumb">
              Administration <span>/</span> Products <span>/</span>
              <strong>Product Details</strong>
            </div>
          </div>

          {/* Title */}
          <section className="apd-heading">
            <div>
              <span className="apd-eyebrow">
                SĀRIKA LUXURY COLLECTION
              </span>

              <h1>Product Details</h1>

              <p>
                Manage your saree design, product images and inventory.
              </p>
            </div>

            <div className="apd-heading-actions">
              <button
                type="button"
                className="apd-edit-btn"
                onClick={() =>
                  navigate(`/admin/products/edit/${id}`)
                }
              >
                <Edit3 size={16} />
                Edit Product
              </button>

              <button
                type="button"
                className="apd-delete-product-btn"
                onClick={openDeleteProductDialog}
              >
                <Trash2 size={16} />
                Delete Product
              </button>
            </div>
          </section>

          {/* Main details */}
          <section className="apd-main-grid">

            {/* Gallery */}
            <div className="apd-gallery-card">
              <div className="apd-gallery-heading">
                <div>
                  <span className="apd-section-label">
                    PRODUCT GALLERY
                  </span>
                  <h2>Design Preview</h2>
                </div>

                <span className="apd-image-count">
                  {images.length} {images.length === 1 ? "Image" : "Images"}
                </span>
              </div>

              <div className="apd-main-image">
                {currentImage ? (
                  <>
                    <img
                      src={currentImage.image}
                      alt={product.name || "Saree"}
                    />

                    <span className="apd-image-number">
                      {activeImage + 1} / {images.length}
                    </span>

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="apd-gallery-arrow apd-gallery-prev"
                          onClick={goToPreviousImage}
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={23} />
                        </button>

                        <button
                          type="button"
                          className="apd-gallery-arrow apd-gallery-next"
                          onClick={goToNextImage}
                          aria-label="Next image"
                        >
                          <ChevronRight size={23} />
                        </button>
                      </>
                    )}

                    <span className="apd-zoom-label">
                      <ZoomIn size={14} />
                      Collection Preview
                    </span>
                  </>
                ) : (
                  <div className="apd-no-image">
                    <ImagePlus size={45} />
                    <h3>No product images</h3>
                    <p>Add images to display this saree.</p>
                  </div>
                )}
              </div>

              <div className="apd-thumbnails-heading">
                <span>ALL PRODUCT IMAGES</span>
                <span>Select an image to preview</span>
              </div>

              {images.length > 0 ? (
                <div className="apd-thumbnail-list">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`apd-thumb-wrapper ${
                        activeImage === index ? "active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="apd-thumb"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Preview image ${index + 1}`}
                      >
                        <img
                          src={image.image}
                          alt={`Product view ${index + 1}`}
                        />
                      </button>

                      {image.is_primary && (
                        <span className="apd-primary-label">
                          Main
                        </span>
                      )}

                      <button
                        type="button"
                        className="apd-delete-image"
                        onClick={() =>
                          openDeleteImageDialog(image.id)
                        }
                        disabled={deletingImage === image.id}
                        title="Delete this image"
                        aria-label="Delete this image"
                      >
                        {deletingImage === image.id ? (
                          <LoaderCircle size={13} />
                        ) : (
                          <X size={15} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="apd-gallery-empty">
                  There are currently no images in this gallery.
                </p>
              )}

              <div className="apd-gallery-note">
                <ShieldCheck size={16} />
                <span>
                  Deleting an image removes only that image, not the
                  entire product.
                </span>
              </div>
            </div>

            {/* Product information */}
            <div className="apd-info-card">
              <div className="apd-info-header">
                <span className="apd-section-label">
                  PRODUCT INFORMATION
                </span>

                <span
                  className={`apd-status ${
                    product.is_active ? "active" : "inactive"
                  }`}
                >
                  {product.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <h2 className="apd-product-name">
                {product.name || product.title || "Untitled Saree"}
              </h2>

              <p className="apd-product-sku">
                SKU: {product.sku || "Not assigned"}
              </p>

              <div className="apd-price-area">
                <span className="apd-price">
                  {formatPrice(
                    product.discount_price || product.price
                  )}
                </span>

                {product.discount_price &&
                  Number(product.price) >
                    Number(product.discount_price) && (
                    <span className="apd-original-price">
                      {formatPrice(product.price)}
                    </span>
                  )}
              </div>

              <div className="apd-info-divider" />

              <div className="apd-spec-grid">
                <div className="apd-spec">
                  <span>Category</span>
                  <strong>{categoryName}</strong>
                </div>

                <div className="apd-spec">
                  <span>Fabric</span>
                  <strong>{product.fabric || "—"}</strong>
                </div>

                <div className="apd-spec">
                  <span>Colour</span>
                  <strong>
                    {product.colour || product.color || "—"}
                  </strong>
                </div>

                <div className="apd-spec">
                  <span>Occasion</span>
                  <strong>{product.occasion || "—"}</strong>
                </div>

                <div className="apd-spec">
                  <span>Stock Quantity</span>
                  <strong>{product.stock ?? "—"}</strong>
                </div>

                <div className="apd-spec">
                  <span>Product ID</span>
                  <strong>#{product.id}</strong>
                </div>
              </div>

              <div className="apd-info-divider" />

              <div className="apd-description">
                <span className="apd-section-label">
                  PRODUCT DESCRIPTION
                </span>

                <p>
                  {product.description ||
                    product.desc ||
                    "No product description has been added."}
                </p>
              </div>

              <div className="apd-info-footer">
                <Package size={18} />
                <span>
                  Inventory information is based on your product record.
                </span>
              </div>
            </div>
          </section>

          <div className="apd-bottom-actions">
            <button
              type="button"
              className="apd-back-bottom"
              onClick={() => navigate("/admin/products")}
            >
              <ArrowLeft size={16} />
              Back to Products
            </button>

            <button
              type="button"
              className="apd-refresh-btn"
              onClick={fetchProduct}
            >
              <RefreshCw size={15} />
              Refresh Details
            </button>
          </div>
        </div>
      </main>

      {/* Luxury confirmation dialog */}
      {dialog.open && (
        <div
          className="apd-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            className="apd-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apd-dialog-title"
          >
            <button
              type="button"
              className="apd-modal-close"
              onClick={closeDialog}
              disabled={deletingImage || deletingProduct}
              aria-label="Close dialog"
            >
              <X size={19} />
            </button>

            <div className="apd-modal-icon">
              <Trash2 size={25} />
            </div>

            <span className="apd-modal-eyebrow">
              SĀRIKA ADMINISTRATION
            </span>

            <h2 id="apd-dialog-title">
              {dialog.type === "image"
                ? "Remove this image?"
                : "Delete this product?"}
            </h2>

            <p>
              {dialog.type === "image"
                ? "This image will be permanently removed from this product gallery. Your other product images and product details will remain unchanged."
                : "This will permanently delete the product and its associated information. This action cannot be undone."}
            </p>

            <div className="apd-modal-actions">
              <button
                type="button"
                className="apd-modal-cancel"
                onClick={closeDialog}
                disabled={deletingImage || deletingProduct}
              >
                Keep It
              </button>

              <button
                type="button"
                className="apd-modal-confirm"
                onClick={handleConfirm}
                disabled={deletingImage || deletingProduct}
              >
                {deletingImage || deletingProduct ? (
                  <>
                    <LoaderCircle size={16} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    {dialog.type === "image"
                      ? "Delete Image"
                      : "Delete Product"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div
          className={`apd-toast ${
            toast.type === "error" ? "error" : "success"
          }`}
          role="status"
        >
          <span className="apd-toast-icon">
            {toast.type === "error" ? "!" : "✓"}
          </span>

          <span>{toast.message}</span>

          <button
            type="button"
            onClick={() =>
              setToast((previous) => ({
                ...previous,
                show: false,
              }))
            }
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
