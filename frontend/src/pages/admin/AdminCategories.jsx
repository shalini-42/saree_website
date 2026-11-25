import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AdminCategories.css";

function AdminCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // --- LUXURY DIALOG STATES ---
  // Notification dialog (success, error, or info)
  const [luxuryNotice, setLuxuryNotice] = useState(null); 
  // e.g. { title: "Success", message: "...", type: "success" | "error" }

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState(null); 
  // e.g. { id: 12, name: "Kanjeevaram Silk" }

  // Helper to trigger custom luxury notice
  const showNotice = (title, message, type = "success") => {
    setLuxuryNotice({ title, message, type });
  };

  const closeNotice = () => {
    setLuxuryNotice(null);
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("categories/");
      const categoryData = response.data.results || response.data;

      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.error("Category loading error:", err.response?.data || err);
      setError("Unable to load categories. Please check your login credentials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setImage(null);
    setImagePreview("");
    setEditingId(null);
    setIsFormOpen(false);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("Invalid File", "Please select a valid image file (PNG, JPG, WebP).", "error");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Add or update category
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showNotice("Required Field", "Please enter a category name before saving.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("is_active", "true");

    if (image) {
      formData.append("image", image);
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.patch(`categories/${editingId}/`, formData);
        showNotice("Collection Updated", `"${name}" has been updated successfully in the SĀRIKA catalog.`, "success");
      } else {
        await api.post("categories/", formData);
        showNotice("Collection Created", `"${name}" has been added successfully to your collections.`, "success");
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      console.error("Category save error:", err.response?.data || err);
      const errorData = err.response?.data;
      const message =
        errorData?.name?.[0] ||
        errorData?.image?.[0] ||
        errorData?.detail ||
        "Unable to save category. Please check your inputs and try again.";

      showNotice("Save Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Edit category
  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || "");
    setImage(null);
    setImagePreview(category.image || "");
    setIsFormOpen(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open Luxury Delete Confirmation Dialog
  const promptDelete = (id, categoryName) => {
    setDeleteTarget({ id, name: categoryName });
  };

  // Execute Deletion
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, name: categoryName } = deleteTarget;
    setDeleteTarget(null); // Close modal

    try {
      await api.delete(`categories/${id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) resetForm();

      showNotice("Collection Removed", `"${categoryName}" was deleted successfully.`, "success");
    } catch (err) {
      console.error("Category deletion error:", err.response?.data || err);
      showNotice(
        "Cannot Delete Collection",
        "This category may contain assigned sarees. Reassign or remove those products before deleting.",
        "error"
      );
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="sarika-admin-categories">
      <div className="sarika-container">
        {/* Header */}
        <header className="sarika-header">
          <div>
            <span className="sarika-subtitle-chip">❖ Atelier Collection Vault</span>
            <h1 className="sarika-title">
              SĀRIKA <span className="sarika-title-slash">/</span> Categories
            </h1>
            <p className="sarika-tagline">
              Curate, edit, and orchestrate your luxury silk saree collections.
            </p>
          </div>

          <div className="sarika-header-actions">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="sarika-btn-outline"
            >
              ← Back to Products
            </button>

            <button
              type="button"
              onClick={fetchCategories}
              disabled={loading}
              className="sarika-btn-outline"
            >
              {loading ? "Syncing..." : "↻ Refresh"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isFormOpen && !editingId) {
                  resetForm();
                } else {
                  resetForm();
                  setIsFormOpen(true);
                }
              }}
              className="sarika-btn-primary"
            >
              {isFormOpen && !editingId ? "✕ Close Form" : "+ New Category"}
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="sarika-metrics-grid">
          <div className="sarika-metric-card">
            <div className="sarika-metric-label">Total Collections</div>
            <div className="sarika-metric-value">{categories.length}</div>
            <div className="sarika-metric-desc">Registered saree varieties</div>
          </div>

          <div className="sarika-metric-card">
            <div className="sarika-metric-label">Active Showcase</div>
            <div className="sarika-metric-value active">{activeCount}</div>
            <div className="sarika-metric-desc">Live and visible to clients</div>
          </div>

          <div className="sarika-metric-card">
            <div className="sarika-metric-label">Catalog Health</div>
            <div className="sarika-metric-value">
              {categories.length ? `${Math.round((activeCount / categories.length) * 100)}%` : "0%"}
            </div>
            <div className="sarika-metric-desc">Published ratio across collections</div>
          </div>
        </div>

        {/* Form Drawer / Section */}
        {(isFormOpen || editingId) && (
          <section className="sarika-form-panel">
            <div className="sarika-form-header">
              <div>
                <span className="sarika-subtitle-chip">
                  {editingId ? "Modification Suite" : "Creation Atelier"}
                </span>
                <h2 className="sarika-form-title">
                  {editingId ? `Editing #${editingId} — ${name || "Untitled"}` : "Create Saree Category"}
                </h2>
              </div>
              <button type="button" onClick={resetForm} className="sarika-btn-cancel-text">
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="sarika-form-layout">
              <div>
                <div className="sarika-field-group">
                  <label className="sarika-label">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kanjeevaram Silk, Banarasi Brocade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="sarika-input"
                  />
                </div>

                <div className="sarika-field-group">
                  <label className="sarika-label">Artisan & Weave Description</label>
                  <textarea
                    placeholder="Document weave origin, zari count, craft details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="sarika-textarea"
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button type="submit" disabled={saving} className="sarika-btn-primary">
                    {saving ? "Saving..." : editingId ? "Update Category" : "Save Category"}
                  </button>

                  <button type="button" onClick={resetForm} className="sarika-btn-outline">
                    Discard
                  </button>
                </div>
              </div>

              <div>
                <label className="sarika-label">Category Asset / Photo</label>
                <div className="sarika-upload-zone">
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Preview" className="sarika-preview-img" />
                      <label className="sarika-btn-outline" style={{ cursor: "pointer", display: "inline-block" }}>
                        Replace Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label style={{ cursor: "pointer", display: "block" }}>
                      <div style={{ fontSize: "36px", color: "var(--accent-gold)", marginBottom: "8px" }}>
                        ❖
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
                        Upload Saree Banner
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        PNG, JPG, WebP supported
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Filter and View Controls */}
        <div className="sarika-controls-bar">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sarika-input sarika-search-box"
          />

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Showing {filteredCategories.length} of {categories.length}
            </span>

            <div className="sarika-view-switch">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`sarika-view-btn ${viewMode === "grid" ? "active" : ""}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`sarika-view-btn ${viewMode === "table" ? "active" : ""}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="sarika-state-box">
            <h3 style={{ color: "var(--primary)", fontFamily: "Playfair Display, serif", margin: 0 }}>
              Loading luxury collections...
            </h3>
          </div>
        ) : error ? (
          <div className="sarika-state-box" style={{ borderColor: "var(--danger)" }}>
            <p style={{ color: "var(--danger)" }}>{error}</p>
            <button
              type="button"
              onClick={fetchCategories}
              className="sarika-btn-primary"
              style={{ marginTop: "12px" }}
            >
              Try Again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="sarika-state-box">
            <div style={{ fontSize: "36px", color: "var(--accent-gold)" }}>❖</div>
            <h3 style={{ color: "var(--primary)", margin: "10px 0 4px", fontFamily: "Playfair Display, serif" }}>
              No categories found
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              Add your first collection above to begin curating the catalog.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="sarika-grid">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="sarika-card">
                <div>
                  <div className="sarika-card-media">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} />
                    ) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dark-gold)" }}>
                        ❖ No Visual
                      </div>
                    )}
                    <span className="sarika-badge-id">#{cat.id}</span>
                  </div>

                  <div className="sarika-card-content">
                    <h3 className="sarika-card-name">{cat.name}</h3>
                    <p className="sarika-card-desc">
                      {cat.description || "No weave description recorded."}
                    </p>
                  </div>
                </div>

                <div className="sarika-card-footer">
                  <span className={`sarika-status-pill ${cat.is_active ? "active" : "inactive"}`}>
                    {cat.is_active ? "● Active" : "○ Inactive"}
                  </span>

                  <div className="sarika-actions-group">
                    <button
                      type="button"
                      onClick={() => handleEdit(cat)}
                      className="sarika-btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => promptDelete(cat.id, cat.name)}
                      className="sarika-btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="sarika-table-wrap">
            <table className="sarika-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>#{cat.id}</td>
                    <td>
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="sarika-table-thumb" />
                      ) : (
                        <div className="sarika-table-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAF4ED", color: "var(--dark-gold)" }}>
                          ❖
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="sarika-table-name">{cat.name}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)", maxWidth: "260px" }}>
                      {cat.description || "—"}
                    </td>
                    <td>
                      <span className={`sarika-status-pill ${cat.is_active ? "active" : "inactive"}`}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="sarika-actions-group" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(cat)}
                          className="sarika-btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDelete(cat.id, cat.name)}
                          className="sarika-btn-delete"
                        >
                          Delete
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

      {/* ==================================================================
          LUXURY IN-APP DIALOGS (REPLACING NATIVE BROWSER ALERTS & CONFIRMS)
          ================================================================== */}

      {/* 1. Notification Dialog (Update, Add, Error, Validation) */}
      {luxuryNotice && (
        <div className="sarika-dialog-backdrop" onClick={closeNotice}>
          <div className="sarika-dialog-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`sarika-dialog-icon ${luxuryNotice.type}`}>
              {luxuryNotice.type === "success" ? "✓" : "!"}
            </div>

            <h3 className="sarika-dialog-title">{luxuryNotice.title}</h3>
            <p className="sarika-dialog-message">{luxuryNotice.message}</p>

            <div className="sarika-dialog-actions">
              <button
                type="button"
                onClick={closeNotice}
                className="sarika-dialog-btn primary"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Luxury Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="sarika-dialog-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="sarika-dialog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sarika-dialog-icon delete">
              ✕
            </div>

            <h3 className="sarika-dialog-title">Delete Collection</h3>
            <p className="sarika-dialog-message">
              Are you sure you wish to remove <strong>"{deleteTarget.name}"</strong>? This will permanently erase the collection from your boutique showroom.
            </p>

            <div className="sarika-dialog-actions">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="sarika-dialog-btn cancel"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="sarika-dialog-btn delete-confirm"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
