
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Package
} from "lucide-react";

import api from "../../services/api";
import AdminNavbar from "../../components/admin/AdminNavbar";
import "./AdminProducts.css";

function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");

  // Custom delete dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: ""
  });

  const [deleting, setDeleting] = useState(false);

  // Custom toast
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type
    });

    window.setTimeout(() => {
      setToast((previous) => ({
        ...previous,
        show: false
      }));
    }, 3000);
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("products/");
      const productData = response.data.results || response.data;

      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      console.error(
        "Product API Error:",
        err.response?.data || err
      );

      setError("Unable to load products. Please check your login.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open product details page
  const handleViewDetails = (productId) => {
    navigate(`/admin/products/${productId}`);
  };

  // Edit product
  const handleEdit = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  // Open custom delete dialog
  const handleDelete = (product) => {
    setDeleteDialog({
      open: true,
      id: product.id,
      name: product.name
    });
  };

  // Close delete dialog
  const closeDeleteDialog = () => {
    if (deleting) return;

    setDeleteDialog({
      open: false,
      id: null,
      name: ""
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      setDeleting(true);

      await api.delete(`products/${deleteDialog.id}/`);

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) => product.id !== deleteDialog.id
        )
      );

      setDeleteDialog({
        open: false,
        id: null,
        name: ""
      });

      showToast("Saree deleted successfully!", "success");
    } catch (err) {
      console.error(
        "Delete error:",
        err.response?.data || err
      );

      setDeleteDialog({
        open: false,
        id: null,
        name: ""
      });

      showToast(
        "Unable to delete saree. Please try again.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Product image
  const imageOf = (product) => {
    if (product.images?.length > 0) {
      const primaryImage = product.images.find(
        (img) => img.is_primary
      );

      const image = primaryImage || product.images[0];

      return typeof image === "string"
        ? image
        : image?.image || null;
    }

    return product.image || product.thumbnail || null;
  };

  // Currency
  const money = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  // Stock status
  const stockLabel = (stock) => {
    const quantity = Number(stock);

    if (quantity === 0) {
      return {
        text: "Out of stock",
        tone: "out"
      };
    }

    if (quantity <= 3) {
      return {
        text: `Only ${quantity} left`,
        tone: "low"
      };
    }

    return {
      text: `${quantity} in stock`,
      tone: "ok"
    };
  };

  // Statistics
  const total = products.length;

  const activeCount = products.filter(
    (product) => product.is_active
  ).length;

  const outCount = products.filter(
    (product) => Number(product.stock) === 0
  ).length;

  const inactiveCount = total - activeCount;

  // Filters
  const filters = [
    {
      key: "all",
      label: "All Products",
      count: total
    },
    {
      key: "active",
      label: "Active",
      count: activeCount
    },
    {
      key: "inactive",
      label: "Inactive",
      count: inactiveCount
    },
    {
      key: "out",
      label: "Out of Stock",
      count: outCount
    }
  ];

  // Search and filter products
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesTerm =
        !term ||
        String(product.name || "")
          .toLowerCase()
          .includes(term) ||
        String(product.sku || "")
          .toLowerCase()
          .includes(term);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && product.is_active) ||
        (filter === "inactive" && !product.is_active) ||
        (filter === "out" &&
          Number(product.stock) === 0);

      return matchesTerm && matchesFilter;
    });
  }, [products, search, filter]);

  // Price display
  const renderPrice = (product) => {
    const price = Number(product.price);
    const discount = Number(product.discount_price);

    const onOffer =
      discount > 0 && discount < price;

    return onOffer ? (
      <>
        <strong>₹{money(discount)}</strong>
        <s>₹{money(price)}</s>
      </>
    ) : (
      <strong>₹{money(price)}</strong>
    );
  };

  // Product actions
  const renderActions = (product) => (
    <div
      className="ap-actions"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="ap-act"
        onClick={() => handleViewDetails(product.id)}
        title="View product details"
      >
        <Eye size={15} />
        View
      </button>

      <button
        type="button"
        className="ap-act"
        onClick={() => handleEdit(product.id)}
        title="Edit product"
      >
        <Edit3 size={15} />
        Edit
      </button>

      <button
        type="button"
        className="ap-act ap-act-danger"
        onClick={() => handleDelete(product)}
        title="Delete product"
      >
        <Trash2 size={15} />
        Delete
      </button>
    </div>
  );

  return (
    <div className="ap-page">

      {/* ================= NAVBAR ================= */}

      <div className="ap-nav">
        <AdminNavbar />
      </div>

      {/* ================= TOAST ================= */}

      {toast.show && (
        <div
          className={`ap-toast ap-toast-${toast.type}`}
          role="status"
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertTriangle size={19} />
          )}

          <span>{toast.message}</span>

          <button
            type="button"
            onClick={() =>
              setToast((previous) => ({
                ...previous,
                show: false
              }))
            }
            aria-label="Close notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ================= DELETE DIALOG ================= */}

      {deleteDialog.open && (
        <div
          className="ap-delete-overlay"
          onClick={closeDeleteDialog}
        >
          <div
            className="ap-delete-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ap-delete-title"
          >
            <button
              type="button"
              className="ap-delete-close"
              onClick={closeDeleteDialog}
              disabled={deleting}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="ap-delete-icon">
              <Trash2 size={27} />
            </div>

            <span className="ap-delete-eyebrow">
              SĀRIKA COLLECTION
            </span>

            <h2 id="ap-delete-title">
              Remove this design?
            </h2>

            <p>
              Are you sure you want to delete
              {" "}
              <strong>{deleteDialog.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="ap-delete-actions">
              <button
                type="button"
                className="ap-delete-cancel"
                onClick={closeDeleteDialog}
                disabled={deleting}
              >
                Keep Product
              </button>

              <button
                type="button"
                className="ap-delete-confirm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO ================= */}

      <header className="ap-hero">
        <div className="ap-hero-inner">

          <div className="ap-hero-text">
            <span className="ap-brand">
              SĀRIKA
            </span>

            <h1>The Collection</h1>

            <p>
              Every saree in your store, in one place.
              Manage designs, explore product details,
              check stock and keep your catalogue current.
            </p>
          </div>

          <div className="ap-hero-buttons">

            <button
              type="button"
              className="ap-btn ap-btn-gold"
              onClick={() =>
                navigate("/admin/products/add")
              }
            >
              + Add New Saree
            </button>

            <button
              type="button"
              className="ap-btn ap-btn-line"
              onClick={() =>
                navigate("/admin/categories")
              }
            >
              Manage Categories
            </button>

            <button
              type="button"
              className="ap-btn ap-btn-line"
              onClick={fetchProducts}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? "ap-refresh-spin" : ""}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              className="ap-btn ap-btn-text"
              onClick={handleLogout}
            >
              Log Out
            </button>

          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="ap-main">

        {/* SUMMARY */}

        <section
          className="ap-figures"
          aria-label="Collection summary"
        >
          <div className="ap-figure">
            <span className="ap-figure-num">
              {total}
            </span>

            <span className="ap-figure-label">
              Sarees in collection
            </span>
          </div>

          <div className="ap-figure">
            <span className="ap-figure-num ap-ok">
              {activeCount}
            </span>

            <span className="ap-figure-label">
              Live in the store
            </span>
          </div>

          <div className="ap-figure">
            <span className="ap-figure-num ap-out">
              {outCount}
            </span>

            <span className="ap-figure-label">
              Out of stock
            </span>
          </div>
        </section>

        {/* TOOLBAR */}

        <div className="ap-toolbar">

          <div className="ap-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by saree name or SKU..."
              aria-label="Search products"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div
            className="ap-chips"
            role="tablist"
            aria-label="Filter products"
          >
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={filter === item.key}
                className={`ap-chip ${
                  filter === item.key ? "is-on" : ""
                }`}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
                <span>{item.count}</span>
              </button>
            ))}
          </div>

          <div
            className="ap-view"
            aria-label="Change layout"
          >
            <button
              type="button"
              className={view === "grid" ? "is-on" : ""}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              title="Gallery view"
            >
              <LayoutGrid size={17} />
              Gallery
            </button>

            <button
              type="button"
              className={view === "list" ? "is-on" : ""}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              title="List view"
            >
              <List size={17} />
              List
            </button>
          </div>

        </div>

        {/* ================= CONTENT ================= */}

        {loading ? (

          <div className="ap-state">
            <RefreshCw
              size={30}
              className="ap-refresh-spin"
            />
            <p>Loading your collection...</p>
          </div>

        ) : error ? (

          <div className="ap-state ap-state-error">
            <AlertTriangle size={30} />
            <h2>Unable to load collection</h2>
            <p>{error}</p>

            <button
              type="button"
              className="ap-btn ap-btn-wine"
              onClick={fetchProducts}
            >
              Try Again
            </button>
          </div>

        ) : products.length === 0 ? (

          <div className="ap-state">
            <Package size={42} />

            <h2>No Sarees Yet</h2>

            <p>
              Add your first design to start building
              the SĀRIKA collection.
            </p>

            <button
              type="button"
              className="ap-btn ap-btn-wine"
              onClick={() =>
                navigate("/admin/products/add")
              }
            >
              Add New Saree
            </button>
          </div>

        ) : visible.length === 0 ? (

          <div className="ap-state">
            <Search size={35} />

            <h2>Nothing Matches</h2>

            <p>
              Try a different name or SKU, or clear
              your filters.
            </p>

            <button
              type="button"
              className="ap-btn ap-btn-wine"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear Filters
            </button>
          </div>

        ) : view === "grid" ? (

          /* ================= GALLERY VIEW ================= */

          <ul className="ap-grid">

            {visible.map((product) => {
              const img = imageOf(product);
              const stock = stockLabel(product.stock);

              return (
                <li
                  key={product.id}
                  className="ap-card"
                >

                  {/* Clickable image */}

                  <div
                    className="ap-card-photo"
                    onClick={() =>
                      handleViewDetails(product.id)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        handleViewDetails(product.id);
                      }
                    }}
                    title="View product details"
                  >

                    {img ? (
                      <img
                        src={img}
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="ap-noimg">
                        <ImageIcon size={35} />
                        <span>No Image</span>
                      </div>
                    )}

                    {!product.is_active && (
                      <span className="ap-tag">
                        Hidden
                      </span>
                    )}

                    <span className="ap-view-overlay">
                      <Eye size={15} />
                      View Details
                    </span>

                  </div>

                  {/* Product information */}

                  <div className="ap-card-body">

                    <p className="ap-sku">
                      {product.sku || "NO SKU"}
                    </p>

                    <h3
                      onClick={() =>
                        handleViewDetails(product.id)
                      }
                      title="View product details"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          handleViewDetails(product.id);
                        }
                      }}
                    >
                      {product.name}
                    </h3>

                    <p className="ap-price">
                      {renderPrice(product)}
                    </p>

                    <p
                      className={`ap-stock ap-stock-${stock.tone}`}
                    >
                      {stock.text}
                    </p>

                  </div>

                  {renderActions(product)}

                </li>
              );
            })}

          </ul>

        ) : (

          /* ================= LIST VIEW ================= */

          <div className="ap-list-wrap">

            <table className="ap-list">

              <thead>
                <tr>
                  <th>Saree</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {visible.map((product) => {
                  const img = imageOf(product);
                  const stock = stockLabel(product.stock);

                  return (
                    <tr key={product.id}>

                      <td>
                        <div className="ap-row-item">

                          <button
                            type="button"
                            className="ap-row-image-button"
                            onClick={() =>
                              handleViewDetails(product.id)
                            }
                            title="View product details"
                          >
                            {img ? (
                              <img
                                src={img}
                                alt={product.name}
                                loading="lazy"
                              />
                            ) : (
                              <span className="ap-row-noimg">
                                <ImageIcon size={17} />
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            className="ap-row-name ap-clickable-name"
                            onClick={() =>
                              handleViewDetails(product.id)
                            }
                          >
                            {product.name}
                          </button>

                        </div>
                      </td>

                      <td className="ap-sku">
                        {product.sku || "—"}
                      </td>

                      <td className="ap-price">
                        {renderPrice(product)}
                      </td>

                      <td>
                        <span
                          className={`ap-stock ap-stock-${stock.tone}`}
                        >
                          {stock.text}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`ap-status ${
                            product.is_active ? "is-live" : ""
                          }`}
                        >
                          {product.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {renderActions(product)}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>
          </div>
        )}

        {/* RESULT COUNT */}

        {!loading && !error && visible.length > 0 && (
          <div className="ap-result-count">
            Showing {visible.length} of {total} products
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminProducts;
