import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Heart,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  Sparkles,
  Layers,
  Compass,
  Check
} from "lucide-react";

import publicApi from "../../services/publicApi";
import customerApi from "../../services/customerApi";

import "./Shop.css";

const BACKEND_URL = "https://saree-website-backend-seven.vercel.app";

function getList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}

function getImageUrl(image) {
  if (!image) return null;

  if (typeof image === "object") {
    image = image.image || image.url || image.thumbnail;
  }

  if (!image) return null;

  if (typeof image !== "string") return null;

  return image.startsWith("http")
    ? image
    : `${BACKEND_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

function getProductImage(product) {
  const images = product.images || [];
  const primaryImage = images.find((image) => image.is_primary);
  const image = primaryImage || images[0];

  return getImageUrl(
    image?.image || product.thumbnail || product.image
  );
}

function getSecondImage(product, primaryUrl) {
  const images = product.images || [];

  for (const image of images) {
    const url = getImageUrl(image?.image);
    if (url && url !== primaryUrl) return url;
  }

  return null;
}

function getCategoryId(product) {
  return product.category?.id ?? product.category;
}

function Photo({ src, alt, className = "", width = 600, height = 800 }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`shop-fallback ${className}`}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <span className="shop-fallback-monogram">SĀRIKA</span>
        <span className="shop-fallback-sub">Atelier Drape</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistError, setWishlistError] = useState("");
  const [busyProduct, setBusyProduct] = useState(null);

  // Open and focus the search field when the navbar search is clicked.
  useEffect(() => {
    const searchValue = searchParams.get("search");

    if (searchValue === "open") {
      searchInputRef.current?.focus();
      setSearchParams({}, { replace: true });
    } else if (searchValue) {
      setSearch(searchValue);
      searchInputRef.current?.focus();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const updateNavbarWishlistCount = (count) => {
    window.dispatchEvent(
      new CustomEvent("customerWishlistChanged", {
        detail: { count: Number(count) || 0 },
      })
    );
  };

  // Load products and categories.
  useEffect(() => {
    let isMounted = true;

    async function fetchShopData() {
      try {
        setLoading(true);
        setError("");

        const [productResponse, categoryResponse] = await Promise.all([
          publicApi.get("products/"),
          publicApi.get("categories/"),
        ]);

        if (!isMounted) return;

        setProducts(getList(productResponse.data));
        setCategories(getList(categoryResponse.data));
      } catch (err) {
        console.error("Shop loading error:", err);

        if (isMounted) {
          setError(
            "We couldn't load the collection. Please check your connection and try again."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchShopData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load wishlist and keep the navbar count in sync.
  useEffect(() => {
    let isMounted = true;

    async function fetchWishlist() {
      const token = localStorage.getItem("customer_access");

      if (!token) {
        if (isMounted) {
          setWishlistIds([]);
          updateNavbarWishlistCount(0);
        }
        return;
      }

      try {
        const response = await customerApi.get("customer/wishlist/");

        if (!isMounted) return;

        const items = response.data.wishlist || [];
        const ids = items.map((item) => Number(item.product));

        setWishlistIds(ids);
        updateNavbarWishlistCount(response.data.count ?? ids.length);
      } catch (err) {
        console.error("Wishlist loading error:", err);
      }
    }

    fetchWishlist();

    const handleAuthChange = () => fetchWishlist();

    window.addEventListener("customerAuthChanged", handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener("customerAuthChanged", handleAuthChange);
    };
  }, []);

  // Add or remove wishlist item.
  const handleWishlist = async (event, productId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!localStorage.getItem("customer_access")) {
      navigate("/customer/login");
      return;
    }

    const numericId = Number(productId);

    if (busyProduct === numericId) return;

    const isSaved = wishlistIds.includes(numericId);
    const previousIds = [...wishlistIds];

    const updatedIds = isSaved
      ? wishlistIds.filter((id) => id !== numericId)
      : [...wishlistIds, numericId];

    setWishlistIds(updatedIds);
    setBusyProduct(numericId);
    setWishlistError("");
    updateNavbarWishlistCount(updatedIds.length);

    try {
      if (isSaved) {
        await customerApi.delete(`customer/wishlist/remove/${numericId}/`);
      } else {
        await customerApi.post("customer/wishlist/", {
          product: numericId,
        });
      }

      updateNavbarWishlistCount(updatedIds.length);
    } catch (err) {
      console.error("Wishlist update error:", err);

      setWishlistIds(previousIds);
      updateNavbarWishlistCount(previousIds.length);

      setWishlistError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to update wishlist. Please try again."
      );
    } finally {
      setBusyProduct(null);
    }
  };

  // Filter and sort products.
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "all") {
      result = result.filter(
        (product) =>
          String(getCategoryId(product)) === String(selectedCategory)
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase().trim();

      result = result.filter((product) => {
        const categoryName =
          typeof product.category === "object"
            ? product.category?.name || product.category?.title
            : "";

        return [
          product.name,
          product.fabric,
          product.colour,
          product.color,
          product.occasion,
          product.description,
          categoryName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(term)
          );
      });
    }

    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          Number(a.discount_price || a.price) -
          Number(b.discount_price || b.price)
      );
    } else if (sort === "price-high") {
      result.sort(
        (a, b) =>
          Number(b.discount_price || b.price) -
          Number(a.discount_price || a.price)
      );
    } else if (sort === "name") {
      result.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    }

    return result;
  }, [products, selectedCategory, search, sort]);

  const getCategoryName = (categoryId) => {
    if (typeof categoryId === "object") {
      return categoryId?.name || categoryId?.title || "SĀRIKA Collection";
    }

    const category = categories.find(
      (item) => String(item.id) === String(categoryId)
    );

    return category?.name || category?.title || "SĀRIKA Collection";
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearch("");
    setSort("featured");
  };

  const filtersActive =
    selectedCategory !== "all" ||
    search.trim() !== "" ||
    sort !== "featured";

  const activeCategoryName =
    selectedCategory === "all"
      ? "All Sarees & Heirlooms"
      : getCategoryName(selectedCategory);

  return (
    <main className="shop-page">
      {/* ─────────────────────────────────────────────────────────────
          1. EDITORIAL ATELIER HERO BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="shop-hero">
        <div className="shop-hero-backdrop" />
        <div className="shop-hero-gold-glow" />

        <div className="shop-hero-inner">
          <div className="shop-eyebrow">
            <span className="shop-eyebrow-line" />
            <Sparkles size={12} className="shop-eyebrow-icon" />
            <span className="shop-eyebrow-text">THE SĀRIKA COUTURE ARCHIVE</span>
            <span className="shop-eyebrow-line" />
          </div>

          <h1 className="shop-hero-title">
            Elegance Woven
            <br />
            <em className="shop-hero-title-italic">Into Every Sacred Thread</em>
          </h1>

          <div className="shop-hero-motif">
            <span className="shop-motif-line" />
            <span className="shop-motif-diamond">❖</span>
            <span className="shop-motif-line" />
          </div>

          <p className="shop-hero-sub">
            Discover heirloom Indian sarees masterfully crafted by hereditary weavers.
            From pure mulberry Kanjeevarams to gossamer Banarasi brocades, curated
            for discerning connoisseurs of timeless luxury.
          </p>

          <a href="#shop-collection" className="shop-hero-link">
            <span>Explore The Collection</span>
            <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="shop-hero-bottom">
          <div className="shop-hero-pill">
            <span className="shop-hero-pill-dot" />
            <span>HEREDITARY WEAVERS</span>
          </div>
          <span className="shop-hero-sep">✦</span>
          <div className="shop-hero-pill">
            <span>PURE MULBERRY SILK</span>
          </div>
          <span className="shop-hero-sep">✦</span>
          <div className="shop-hero-pill">
            <span>AUTHENTIC ZARI EMBROIDERY</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. LUXURY COLLECTION / CATEGORY RIBBON
      ───────────────────────────────────────────────────────────── */}
      <section className="shop-category-section" aria-label="Shop by collection">
        <div className="shop-section-heading">
          <span className="shop-kicker">CURATED BY WEAVE & OCCASION</span>
          <h2 className="shop-section-title">
            Explore by <em>Collection</em>
          </h2>
          <div className="shop-title-divider">
            <span />
            <p>❖</p>
            <span />
          </div>
        </div>

        <div className="shop-category-scroll-container">
          <ul className="shop-category-list">
            <li>
              <button
                type="button"
                className={`shop-category-item shop-category-all-button ${
                  selectedCategory === "all" ? "active" : ""
                }`}
                aria-pressed={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
              >
                <span className="shop-category-circle shop-category-all">
                  <span className="shop-category-all-text">ALL</span>
                </span>
                <span className="shop-category-name">Complete Atelier</span>
                <span className="shop-category-count">{products.length} pieces</span>
              </button>
            </li>

            {categories.map((category) => {
              const categoryImage = getImageUrl(
                category.thumbnail || category.image
              );

              const categoryName = category.name || category.title;
              const isActive =
                String(selectedCategory) === String(category.id);

              return (
                <li key={category.id}>
                  <button
                    type="button"
                    className={`shop-category-item ${
                      isActive ? "active" : ""
                    }`}
                    aria-pressed={isActive}
                    onClick={() => setSelectedCategory(String(category.id))}
                  >
                    <span className="shop-category-circle">
                      <Photo src={categoryImage} alt={categoryName} width={180} height={180} />
                      <span className="shop-category-ring" />
                    </span>
                    <span className="shop-category-name">{categoryName}</span>
                    <span className="shop-category-pill">Curated</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. EDITORIAL SHOWCASE & FILTER TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <section className="shop-content" id="shop-collection">
        <div className="shop-toolbar-wrapper">
          <div className="shop-toolbar">
            <div className="shop-results">
              <span className="shop-results-kicker">SĀRIKA EXCLUSIVE ARCHIVE</span>
              <h2 className="shop-results-title">{activeCategoryName}</h2>
              <p className="shop-results-count" aria-live="polite">
                {loading
                  ? "Unveiling atelier pieces..."
                  : `${filteredProducts.length} ${
                      filteredProducts.length === 1
                        ? "Masterpiece Available"
                        : "Masterpieces Available"
                    }`}
              </p>
            </div>

            <div className="shop-controls">
              {/* Search input with gold focus state */}
              <div className="shop-search-box">
                <Search size={16} className="shop-search-icon" />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search silk, zari, colour, occasion..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search sarees"
                  className="shop-search-input"
                />
                {search && (
                  <button
                    type="button"
                    className="shop-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sorting selector with luxury styling */}
              <div className="shop-sort-wrap">
                <SlidersHorizontal size={14} className="shop-sort-icon" />
                <select
                  className="shop-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  aria-label="Sort products"
                >
                  <option value="featured">Featured Atelier Picks</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Collection: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {filtersActive && (
            <div className="shop-active-filters">
              <span className="shop-active-label">Active Curation:</span>
              {selectedCategory !== "all" && (
                <span className="shop-filter-chip">
                  Collection: {activeCategoryName}
                </span>
              )}
              {search.trim() !== "" && (
                <span className="shop-filter-chip">
                  Keyword: "{search.trim()}"
                </span>
              )}
              {sort !== "featured" && (
                <span className="shop-filter-chip">
                  Sort: {sort.replace("-", " ")}
                </span>
              )}
              <button
                type="button"
                className="shop-filter-reset"
                onClick={clearFilters}
              >
                Reset All <X size={12} />
              </button>
            </div>
          )}

          {wishlistError && (
            <div className="shop-wishlist-error" role="alert">
              <span>{wishlistError}</span>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. PRODUCTS GRID / SKELETON / EMPTY STATES
        ───────────────────────────────────────────────────────────── */}

        {/* LOADING SKELETONS */}
        {loading && (
          <div className="shop-product-grid" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="shop-skeleton-card" key={index}>
                <div className="shop-skeleton-image" />
                <div className="shop-skeleton-meta">
                  <div className="shop-skeleton-line short" />
                  <div className="shop-skeleton-line title" />
                  <div className="shop-skeleton-line price" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="shop-message shop-error-card" role="alert">
            <span className="shop-message-eyebrow">TEMPORARY PAUSE</span>
            <h3 className="shop-message-title">Our Atelier Is Taking a Moment</h3>
            <p className="shop-message-text">{error}</p>
            <button
              type="button"
              className="shop-luxury-btn"
              onClick={() => window.location.reload()}
            >
              Reconnect to Boutique
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="shop-message shop-empty-card">
            <span className="shop-message-eyebrow">NO MATCHES DISCOVERED</span>
            <h3 className="shop-message-title">No Sarees Found for Your Criteria</h3>
            <p className="shop-message-text">
              We couldn't find matching handloom pieces. Try refining your keywords
              or explore our complete bridal and royal silk archive.
            </p>
            <button
              type="button"
              className="shop-luxury-btn"
              onClick={clearFilters}
            >
              Explore Complete Collection
            </button>
          </div>
        )}

        {/* PRODUCT CARDS LIST */}
        {!loading && !error && filteredProducts.length > 0 && (
          <ul className="shop-product-grid">
            {filteredProducts.map((product) => {
              const imageUrl = getProductImage(product);
              const hoverUrl = getSecondImage(product, imageUrl);

              const hasDiscount =
                product.discount_price &&
                Number(product.discount_price) < Number(product.price);

              const isSaved = wishlistIds.includes(Number(product.id));
              const isBusy = busyProduct === Number(product.id);
              const soldOut = Number(product.stock) === 0;

              return (
                <li key={product.id} className="shop-product-item">
                  <article
                    className={`shop-product-card ${
                      soldOut ? "is-sold-out" : ""
                    }`}
                  >
                    {/* Visual Media Frame (3:4 ratio for Sarees) */}
                    <div className="shop-product-image">
                      <Link
                        to={`/product/${product.id}`}
                        className="shop-product-image-link"
                        aria-label={`View ${product.name}`}
                      >
                        <Photo
                          className="shop-img-main"
                          src={imageUrl}
                          alt={product.name}
                        />

                        {hoverUrl && (
                          <img
                            className="shop-img-alt"
                            src={hoverUrl}
                            alt=""
                            width={600}
                            height={800}
                            loading="lazy"
                            decoding="async"
                            aria-hidden="true"
                          />
                        )}
                      </Link>

                      {/* Floating Glassmorphism Wishlist Button */}
                      <button
                        type="button"
                        className={`shop-wishlist-btn ${
                          isSaved ? "saved" : ""
                        }`}
                        onClick={(event) =>
                          handleWishlist(event, product.id)
                        }
                        disabled={isBusy}
                        aria-pressed={isSaved}
                        aria-label={
                          isSaved
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                      >
                        <Heart
                          size={18}
                          fill={isSaved ? "currentColor" : "none"}
                          strokeWidth={1.8}
                          className="shop-wishlist-heart"
                        />
                      </button>

                      {/* Editorial Badges */}
                      <div className="shop-badge-stack">
                        {hasDiscount && !soldOut && (
                          <span className="shop-badge shop-badge--discount">
                            ATELIER EDITION
                          </span>
                        )}

                        {soldOut && (
                          <span className="shop-badge shop-badge--sold">
                            ARCHIVE ARCHIVED
                          </span>
                        )}
                      </div>

                      {/* Hover Slide-Up Quick Action */}
                      <Link
                        to={`/product/${product.id}`}
                        className="shop-quick-view"
                      >
                        <span>View Drape & Details</span>
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>

                    {/* Saree Metadata & Pricing */}
                    <div className="shop-product-info">
                      <div className="shop-product-header">
                        <span className="shop-product-category">
                          {getCategoryName(product.category)}
                        </span>
                        {product.occasion && (
                          <span className="shop-product-occasion">
                            {product.occasion}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/product/${product.id}`}
                        className="shop-product-title"
                      >
                        <h3>{product.name}</h3>
                      </Link>

                      {(product.fabric || product.colour || product.color) && (
                        <p className="shop-product-description">
                          {[product.fabric, product.colour || product.color]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      <div className="shop-product-price-row">
                        <div className="shop-product-price">
                          <span className="shop-price-current">
                            ₹
                            {Number(
                              hasDiscount
                                ? product.discount_price
                                : product.price
                            ).toLocaleString("en-IN")}
                          </span>

                          {hasDiscount && (
                            <del className="shop-price-old">
                              ₹{Number(product.price).toLocaleString("en-IN")}
                            </del>
                          )}
                        </div>

                        {hasDiscount && (
                          <span className="shop-price-saved">
                            Save ₹
                            {(
                              Number(product.price) -
                              Number(product.discount_price)
                            ).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. EDITORIAL ATELIER SIGN-OFF FOOTER
        ───────────────────────────────────────────────────────────── */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="shop-bottom-note">
            <span className="shop-bottom-rule" />
            <div className="shop-bottom-badge">
              <span className="shop-bottom-diamond">❖</span>
              <p className="shop-bottom-text">
                SĀRIKA ATELIER · HANDCRAFTED IN INDIA · HEIRLOOM SILKS
              </p>
              <span className="shop-bottom-diamond">❖</span>
            </div>
            <span className="shop-bottom-rule" />
          </div>
        )}
      </section>
    </main>
  );
}