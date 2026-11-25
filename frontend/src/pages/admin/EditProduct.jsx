import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./EditProduct.css";

/* ---------------- SVG ICONS ---------------- */

const CheckIcon = () => (
  <svg viewBox="0 0 52 52" className="sk-check" aria-hidden="true">
    <circle className="sk-check__ring" cx="26" cy="26" r="23" fill="none" />
    <path className="sk-check__tick" fill="none" d="M15 27l8 8 14-16" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="27" height="27" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

/* ---------------- LUXURY DIALOG ---------------- */

function Dialog({
  tone = "gold",
  icon,
  eyebrow,
  title,
  message,
  children,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="sk-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`sk-dialog sk-dialog--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sk-dialog-title"
      >
        <button
          type="button"
          className="sk-dialog__close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <CloseIcon />
        </button>

        <div className="sk-dialog__ornament">
          <span />
          <span className="sk-dialog__ornament-star">✦</span>
          <span />
        </div>

        <div className="sk-dialog__icon">{icon}</div>

        <p className="sk-dialog__eyebrow">
          {eyebrow || "SĀRIKA EXCLUSIVE"}
        </p>

        <h2 id="sk-dialog-title" className="sk-dialog__title">
          {title}
        </h2>

        <p className="sk-dialog__message">{message}</p>

        <div className="sk-dialog__divider">
          <span />
          <span>✦</span>
          <span />
        </div>

        <div className="sk-dialog__actions">{children}</div>

        <p className="sk-dialog__footer">
          SĀRIKA <span>·</span> THE ART OF ELEGANCE
        </p>
      </div>
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

const formatINR = (value) =>
  value === "" || value === null || isNaN(Number(value))
    ? "—"
    : `₹${Number(value).toLocaleString("en-IN")}`;

/* ---------------- MAIN COMPONENT ---------------- */

function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    price: "",
    discount_price: "",
    fabric: "",
    colour: "",
    occasion: "",
    stock: 0,
    is_featured: false,
    is_active: true,
  });

  /* ---------------- FETCH PRODUCT ---------------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);

        const [productResponse, categoryResponse] = await Promise.all([
          api.get(`products/${id}/`),
          api.get("categories/"),
        ]);

        const product = productResponse.data;
        const categoryData = categoryResponse.data;

        setCategories(
          categoryData.results || categoryData
        );

        setForm({
          name: product.name || "",
          sku: product.sku || "",
          description: product.description || "",
          category: String(product.category || ""),
          price: product.price ?? "",
          discount_price: product.discount_price ?? "",
          fabric: product.fabric || "",
          colour: product.colour || "",
          occasion: product.occasion || "",
          stock: product.stock ?? 0,
          is_featured: product.is_featured ?? false,
          is_active: product.is_active ?? true,
        });

        setExistingImages(product.images || []);
      } catch (err) {
        console.error(
          "Product loading error:",
          err.response?.data || err
        );

        setError(
          "Unable to load saree details. Please try again."
        );
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id]);

  /* ---------------- IMAGE PREVIEWS ---------------- */

  const newPreviews = useMemo(
    () => newImages.map((file) => URL.createObjectURL(file)),
    [newImages]
  );

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  const coverImage =
    existingImages[0]?.image || newPreviews[0] || null;

  /* ---------------- FORM HANDLERS ---------------- */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });

    newImages.forEach((image) => {
      data.append("images", image);
    });

    try {
      setLoading(true);

      // Existing backend endpoint — unchanged
      await api.put(`products/${id}/`, data);

      setModal("saved");
    } catch (err) {
      console.error(
        "Product update error:",
        err.response?.data || err
      );

      const details = err.response?.data;

      setError(
        typeof details === "object" && details !== null
          ? Object.entries(details)
              .map(([key, value]) =>
                `${key}: ${
                  Array.isArray(value) ? value.join(", ") : value
                }`
              )
              .join(" | ")
          : "Unable to update product. Please try again."
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE HANDLER ---------------- */

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError("");

      // Existing backend endpoint — unchanged
      await api.delete(`products/${id}/`);

      setModal("deleted");
    } catch (err) {
      console.error(
        "Product delete error:",
        err.response?.data || err
      );

      setDeleteError(
        "We couldn't remove this saree. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const goToProducts = () => navigate("/admin/products");

  const fields = [
    ["name", "Saree name", "Royal Banarasi Silk Saree"],
    ["sku", "SKU", "SAR-BAN-001"],
    ["fabric", "Fabric", "Pure Kanjeevaram Silk"],
    ["colour", "Colour", "Royal Maroon"],
    ["occasion", "Occasion", "Wedding, Festival, Party"],
  ];

  /* ---------------- LOADING ---------------- */

  if (fetching) {
    return (
      <div className="sk-loader">
        <div className="sk-loader__mark">S</div>
        <p>Preparing your saree details…</p>
      </div>
    );
  }

  const hasDiscount =
    form.discount_price !== "" &&
    Number(form.discount_price) > 0;

  const selectedCategory = categories.find(
    (category) => String(category.id) === form.category
  );

  /* ---------------- PAGE ---------------- */

  return (
    <div className="sk-page">
      {/* LEFT PRODUCT PREVIEW */}

      <aside className="sk-aside">
        <div className="sk-aside__top">
          <span className="sk-aside__brand">SĀRIKA</span>
          <span className="sk-aside__label">ATELIER COLLECTION</span>
        </div>

        <div className="sk-tag">
          <span className="sk-tag__hole" />

          <div className="sk-tag__photo">
            {coverImage ? (
              <img
                src={coverImage}
                alt={form.name || "Saree"}
              />
            ) : (
              <div className="sk-tag__empty">
                No image yet
              </div>
            )}

            <span
              className={`sk-status ${
                form.is_active ? "is-live" : "is-hidden"
              }`}
            >
              {form.is_active ? "Live in store" : "Hidden"}
            </span>
          </div>

          <div className="sk-tag__body">
            <p className="sk-tag__category">
              {selectedCategory?.name || "Uncategorised"}
            </p>

            <h2 className="sk-tag__name">
              {form.name || "Untitled saree"}
            </h2>

            <p className="sk-tag__meta">
              {[form.fabric, form.colour]
                .filter(Boolean)
                .join(", ") || "Fabric and colour"}
            </p>

            <div className="sk-tag__price">
              {hasDiscount ? (
                <>
                  <span className="sk-tag__price-now">
                    {formatINR(form.discount_price)}
                  </span>
                  <span className="sk-tag__price-was">
                    {formatINR(form.price)}
                  </span>
                </>
              ) : (
                <span className="sk-tag__price-now">
                  {formatINR(form.price)}
                </span>
              )}
            </div>

            <dl className="sk-tag__facts">
              <div>
                <dt>SKU</dt>
                <dd>{form.sku || "—"}</dd>
              </div>
              <div>
                <dt>In stock</dt>
                <dd>{form.stock}</dd>
              </div>
              <div>
                <dt>Featured</dt>
                <dd>{form.is_featured ? "Yes" : "No"}</dd>
              </div>
            </dl>

            <div className="sk-tag__signature">
              <span>✦</span>
              <span>CRAFTED WITH ELEGANCE</span>
              <span>✦</span>
            </div>
          </div>
        </div>

        <p className="sk-aside__note">
          Your product preview updates as you edit.
        </p>
      </aside>

      {/* RIGHT EDIT FORM */}

      <main className="sk-main">
        <button
          type="button"
          onClick={goToProducts}
          className="sk-back"
        >
          <span>←</span> Back to collection
        </button>

        <header className="sk-header">
          <p className="sk-header__brand">
            SĀRIKA ATELIER <span>✦</span> PRODUCT MANAGEMENT
          </p>

          <h1 className="sk-header__title">Edit saree</h1>

          <p className="sk-header__sub">
            Refine the details of this piece in your luxury collection.
          </p>

          <div className="sk-header__line" />
        </header>

        {error && (
          <div className="sk-alert" role="alert">
            <strong>Couldn't save changes.</strong>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="sk-form">
          {/* PRODUCT DETAILS */}

          <section className="sk-section">
            <div className="sk-section__heading">
              <span className="sk-section__number">01</span>
              <div>
                <h2 className="sk-section__title">The piece</h2>
                <p className="sk-section__hint">
                  Name, fabric and the story behind the saree.
                </p>
              </div>
            </div>

            <div className="sk-grid sk-grid--2">
              {fields.map(([name, label, placeholder]) => (
                <div className="sk-field" key={name}>
                  <input
                    id={`f-${name}`}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required
                  />
                  <label htmlFor={`f-${name}`}>{label}</label>
                </div>
              ))}

              <div className="sk-field sk-field--select">
                <select
                  id="f-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="f-category">Category</label>
              </div>
            </div>

            <div className="sk-field sk-field--area">
              <textarea
                id="f-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe the weave, the drape and the occasion it was made for."
                required
              />
              <label htmlFor="f-description">Description</label>
            </div>
          </section>

          {/* PRICING AND STOCK */}

          <section className="sk-section">
            <div className="sk-section__heading">
              <span className="sk-section__number">02</span>
              <div>
                <h2 className="sk-section__title">
                  Pricing and stock
                </h2>
                <p className="sk-section__hint">
                  Set the price and available inventory.
                </p>
              </div>
            </div>

            <div className="sk-grid sk-grid--3">
              <div className="sk-field sk-field--money">
                <span className="sk-field__prefix">₹</span>
                <input
                  id="f-price"
                  type="number"
                  name="price"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
                <label htmlFor="f-price">Price</label>
              </div>

              <div className="sk-field sk-field--money">
                <span className="sk-field__prefix">₹</span>
                <input
                  id="f-discount"
                  type="number"
                  name="discount_price"
                  min="0"
                  step="0.01"
                  value={form.discount_price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <label htmlFor="f-discount">Offer price</label>
              </div>

              <div className="sk-field">
                <input
                  id="f-stock"
                  type="number"
                  name="stock"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
                <label htmlFor="f-stock">Stock quantity</label>
              </div>
            </div>
          </section>

          {/* PRODUCT GALLERY */}

          <section className="sk-section">
            <div className="sk-section__heading">
              <span className="sk-section__number">03</span>
              <div>
                <h2 className="sk-section__title">Gallery</h2>
                <p className="sk-section__hint">
                  Add beautiful images to showcase this saree.
                </p>
              </div>
            </div>

            {existingImages.length > 0 || newPreviews.length > 0 ? (
              <ul className="sk-gallery">
                {existingImages.map((image, index) => (
                  <li key={image.id || index} className="sk-gallery__item">
                    <img
                      src={image.image}
                      alt={`${form.name} ${index + 1}`}
                    />
                    {index === 0 && (
                      <span className="sk-gallery__cover">
                        COVER
                      </span>
                    )}
                  </li>
                ))}

                {newPreviews.map((src, index) => (
                  <li
                    key={src}
                    className="sk-gallery__item is-new"
                  >
                    <img src={src} alt={`New upload ${index + 1}`} />
                    <span className="sk-gallery__new">NEW</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sk-empty">
                No images yet. Add the first photo below.
              </p>
            )}

            <label className="sk-drop">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setNewImages(Array.from(event.target.files || []))
                }
              />

              <span className="sk-drop__icon">
                <UploadIcon />
              </span>

              <span className="sk-drop__title">
                Add more photos
              </span>

              <span className="sk-drop__sub">
                {newImages.length > 0
                  ? `${newImages.length} new image(s) ready to upload`
                  : "Click to choose images from your device"}
              </span>
            </label>
          </section>

          {/* VISIBILITY */}

          <section className="sk-section">
            <div className="sk-section__heading">
              <span className="sk-section__number">04</span>
              <div>
                <h2 className="sk-section__title">Visibility</h2>
                <p className="sk-section__hint">
                  Control where this saree appears in your store.
                </p>
              </div>
            </div>

            <label className="sk-switch">
              <span className="sk-switch__text">
                <strong>Featured saree</strong>
                <small>
                  Show this saree on the home page highlights.
                </small>
              </span>

              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
              />

              <span className="sk-switch__track" />
            </label>

            <label className="sk-switch">
              <span className="sk-switch__text">
                <strong>Active in store</strong>
                <small>
                  Customers can see and buy this saree.
                </small>
              </span>

              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />

              <span className="sk-switch__track" />
            </label>
          </section>

          {/* ACTION BUTTONS */}

          <div className="sk-actions">
            <button
              type="button"
              className="sk-btn sk-btn--danger"
              onClick={() => {
                setDeleteError("");
                setModal("confirmDelete");
              }}
            >
              <TrashIcon />
              Delete saree
            </button>

            <div className="sk-actions__right">
              <button
                type="button"
                className="sk-btn sk-btn--ghost"
                onClick={goToProducts}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="sk-btn sk-btn--primary"
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* SUCCESS: UPDATED */}

      {modal === "saved" && (
        <Dialog
          tone="gold"
          icon={<CheckIcon />}
          eyebrow="CHANGES SAVED"
          title="Saree updated"
          message={`${form.name || "This saree"} has been saved. Your changes are now live in the collection.`}
          onClose={goToProducts}
        >
          <button
            type="button"
            className="sk-btn sk-btn--primary"
            onClick={goToProducts}
          >
            Back to collection
          </button>

          <button
            type="button"
            className="sk-btn sk-btn--ghost"
            onClick={() => setModal(null)}
          >
            Keep editing
          </button>
        </Dialog>
      )}

      {/* LUXURY DELETE CONFIRMATION */}

      {modal === "confirmDelete" && (
        <Dialog
          tone="danger"
          icon={<TrashIcon />}
          eyebrow="COLLECTION MANAGEMENT"
          title="Remove this creation?"
          message={`“${form.name || "This saree"}” will be permanently removed from your SĀRIKA collection. This action cannot be undone.`}
          onClose={() => !deleting && setModal(null)}
        >
          {deleteError && (
            <p className="sk-dialog__error" role="alert">
              {deleteError}
            </p>
          )}

          <button
            type="button"
            className="sk-btn sk-btn--ghost"
            onClick={() => setModal(null)}
            disabled={deleting}
          >
            Keep this saree
          </button>

          <button
            type="button"
            className="sk-btn sk-btn--delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="sk-button-spinner" />
                Removing…
              </>
            ) : (
              <>
                <TrashIcon />
                Delete permanently
              </>
            )}
          </button>
        </Dialog>
      )}

      {/* SUCCESS: DELETED */}

      {modal === "deleted" && (
        <Dialog
          tone="gold"
          icon={<CheckIcon />}
          eyebrow="SUCCESSFULLY REMOVED"
          title="Saree deleted"
          message="The saree has been successfully removed from your collection."
          onClose={goToProducts}
        >
          <button
            type="button"
            className="sk-btn sk-btn--primary"
            onClick={goToProducts}
          >
            Back to collection
          </button>
        </Dialog>
      )}
    </div>
  );
}

export default EditProduct;