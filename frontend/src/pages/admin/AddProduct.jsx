import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AddProduct.css";

function AddProduct() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("categories/");
        setCategories(response.data.results || response.data);
      } catch (err) {
        console.error("Category loading error:", err);
        setError("Unable to load categories. Please check your login.");
      }
    };

    fetchCategories();
  }, []);

  // Local previews for the selected images (display only, nothing sent to backend)
  const previews = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images]
  );

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImages = (e) => {
    const picked = Array.from(e.target.files || []);
    setImages((previous) => [...previous, ...picked]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((previous) => previous.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.category) {
      setError("Please select a product category.");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one saree image.");
      return;
    }

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });

    images.forEach((image) => {
      data.append("images", image);
    });

    try {
      setLoading(true);

      await api.post("products/", data);

      alert("Saree product added successfully!");
      navigate("/admin/products");
    } catch (err) {
      console.error("Product creation error:", err.response?.data || err);

      const details = err.response?.data;
      setError(
        typeof details === "object"
          ? Object.entries(details)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join(" | ")
          : "Unable to add product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- live preview helpers ---------- */
  const money = (v) => Number(v).toLocaleString("en-IN");
  const price = Number(form.price);
  const discount = Number(form.discount_price);
  const hasDiscount = price > 0 && discount > 0 && discount < price;
  const percentOff = hasDiscount ? Math.round(((price - discount) / price) * 100) : 0;
  const categoryName = categories.find((c) => String(c.id) === String(form.category))?.name;

  return (
    <div className="sk-page">
      {/* ================= LEFT: brand + live preview ================= */}
      <aside className="sk-aside">
        <div className="sk-aside-inner">
          <button type="button" className="sk-back" onClick={() => navigate("/admin/products")}>
            <span aria-hidden="true">←</span> Back to products
          </button>

          <div className="sk-brand">
            <span className="sk-brand-mark">SĀRIKA</span>
            <span className="sk-brand-sub">Atelier Administration</span>
          </div>

          <div className="sk-preview" aria-label="Live product preview">
            <div className="sk-preview-frame">
              {previews[0] ? (
                <img src={previews[0]} alt="Cover preview" />
              ) : (
                <div className="sk-preview-empty">
                  <span>Cover photograph</span>
                  <small>Appears here as you upload</small>
                </div>
              )}
              {hasDiscount && <span className="sk-badge">{percentOff}% off</span>}
              {form.is_featured && <span className="sk-badge sk-badge-feature">Featured</span>}
            </div>

            <div className="sk-preview-body">
              <p className="sk-preview-meta">
                {[categoryName, form.fabric].filter(Boolean).join(" · ") || "Category · Fabric"}
              </p>
              <h3 className="sk-preview-name">{form.name || "Name of the saree"}</h3>
              <p className="sk-preview-price">
                {price > 0 ? (
                  hasDiscount ? (
                    <>
                      <strong>₹{money(discount)}</strong>
                      <s>₹{money(price)}</s>
                    </>
                  ) : (
                    <strong>₹{money(price)}</strong>
                  )
                ) : (
                  <strong className="sk-muted">₹ —</strong>
                )}
              </p>
            </div>
          </div>

          <p className="sk-aside-note">
            This is how the saree will appear to customers in your collection.
          </p>
        </div>
      </aside>

      {/* ================= RIGHT: the form ================= */}
      <main className="sk-main">
        <header className="sk-head">
          <h1>Add a new saree</h1>
          <p>Enter the details of the piece exactly as you want it presented to customers.</p>
        </header>

        <form onSubmit={handleSubmit} className="sk-form">
          {/* ---- Details ---- */}
          <section className="sk-section">
            <div className="sk-section-intro">
              <h2>The piece</h2>
              <p>Name, category and the story of the weave.</p>
            </div>

            <div className="sk-fields sk-grid-2">
              <div className="sk-field sk-span-2">
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="name">Saree name</label>
                <small>e.g. Royal Banarasi Silk Saree</small>
              </div>

              <div className="sk-field">
                <input
                  id="sku"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="sku">SKU</label>
                <small>e.g. SAR-BAN-001</small>
              </div>

              <div className="sk-field sk-select">
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="" />
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="category">Category</label>
                {categories.length === 0 && (
                  <small>No categories yet. Add one in Django Admin first.</small>
                )}
              </div>

              <div className="sk-field">
                <input
                  id="fabric"
                  name="fabric"
                  value={form.fabric}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="fabric">Fabric</label>
                <small>e.g. Pure Kanjeevaram Silk</small>
              </div>

              <div className="sk-field">
                <input
                  id="colour"
                  name="colour"
                  value={form.colour}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="colour">Colour</label>
                <small>e.g. Royal Maroon</small>
              </div>

              <div className="sk-field sk-span-2">
                <input
                  id="occasion"
                  name="occasion"
                  value={form.occasion}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="occasion">Occasion</label>
                <small>e.g. Wedding, Festival, Party</small>
              </div>

              <div className="sk-field sk-span-2">
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder=" "
                  required
                />
                <label htmlFor="description">Description</label>
                <small>Describe the design, the weaving and the craftsmanship.</small>
              </div>
            </div>
          </section>

          {/* ---- Pricing ---- */}
          <section className="sk-section">
            <div className="sk-section-intro">
              <h2>Price and stock</h2>
              <p>Leave the offer price empty if the piece is not on sale.</p>
            </div>

            <div className="sk-fields sk-grid-3">
              <div className="sk-field sk-money">
                <span className="sk-currency">₹</span>
                <input
                  id="price"
                  type="number"
                  name="price"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="price">Price</label>
              </div>

              <div className="sk-field sk-money">
                <span className="sk-currency">₹</span>
                <input
                  id="discount_price"
                  type="number"
                  name="discount_price"
                  min="0"
                  step="0.01"
                  value={form.discount_price}
                  onChange={handleChange}
                  placeholder=" "
                />
                <label htmlFor="discount_price">Offer price</label>
              </div>

              <div className="sk-field">
                <input
                  id="stock"
                  type="number"
                  name="stock"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label htmlFor="stock">Pieces in stock</label>
              </div>
            </div>
          </section>

          {/* ---- Images ---- */}
          <section className="sk-section">
            <div className="sk-section-intro">
              <h2>Photographs</h2>
              <p>
                Add as many views as you like: full drape, pallu, border and
                close-up of the weave. The first photo is the cover.
              </p>
            </div>

            <div className="sk-fields">
              <label className="sk-drop">
                <input type="file" accept="image/*" multiple onChange={handleImages} />
                <span className="sk-drop-title">Drop photographs here</span>
                <span className="sk-drop-sub">or click to browse your files</span>
              </label>

              {previews.length > 0 && (
                <ul className="sk-thumbs">
                  {previews.map((src, index) => (
                    <li key={src} className="sk-thumb">
                      <img src={src} alt={`Selected ${index + 1}`} />
                      {index === 0 && <span className="sk-cover-tag">Cover</span>}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ---- Visibility ---- */}
          <section className="sk-section">
            <div className="sk-section-intro">
              <h2>Visibility</h2>
              <p>Control where this saree appears in your store.</p>
            </div>

            <div className="sk-fields sk-switches">
              <label className="sk-switch">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                />
                <span className="sk-track" aria-hidden="true" />
                <span className="sk-switch-text">
                  <strong>Feature on the homepage</strong>
                  <small>Highlight this saree in the featured collection.</small>
                </span>
              </label>

              <label className="sk-switch">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span className="sk-track" aria-hidden="true" />
                <span className="sk-switch-text">
                  <strong>Available to customers</strong>
                  <small>Turn off to keep this saree hidden from the store.</small>
                </span>
              </label>
            </div>
          </section>

          {error && (
            <div className="sk-error" role="alert">
              {error}
            </div>
          )}

          <footer className="sk-actions">
            <button type="button" className="sk-btn-ghost" onClick={() => navigate("/admin/products")}>
              Cancel
            </button>
            <button type="submit" className="sk-btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Add to collection"}
            </button>
          </footer>
        </form>
      </main>
    </div>
  );
}

export default AddProduct;
