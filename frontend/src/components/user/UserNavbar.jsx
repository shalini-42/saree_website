
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  Menu,
  X,
  ShoppingBag,
  Search,
  UserRound,
  ChevronDown,
  Package,
  LogOut,
  LockKeyhole,
  Heart,
  RefreshCw,
} from "lucide-react";

import customerApi from "../../services/customerApi";
import useStoreSettings from "../../hooks/useStoreSettings";

import "./UserNavbar.css";

export default function UserNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useStoreSettings();

  const accountRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [username, setUsername] = useState(
    localStorage.getItem("customer_username") || ""
  );

  const [cartCount, setCartCount] = useState(
    Number(localStorage.getItem("customer_cart_count") || 0)
  );

  const [wishlistCount, setWishlistCount] = useState(0);

  const isLoggedIn = Boolean(
    username && localStorage.getItem("customer_access")
  );

  const storeName = settings?.store_name || "SĀRIKA";
  const storeLogo = settings?.store_logo || "";

  const isHome = location.pathname === "/";
  const overlay = isHome && !scrolled && !menuOpen;

  const closeMenu = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  // SEARCH
  const handleSearchClick = () => {
    closeMenu();
    navigate("/shop?search=open");
  };

  // LOAD WISHLIST COUNT
  const loadWishlistCount = useCallback(async () => {
    const token = localStorage.getItem("customer_access");
    const customerName = localStorage.getItem("customer_username");

    if (!token || !customerName) {
      setWishlistCount(0);
      return;
    }

    try {
      const response = await customerApi.get("customer/wishlist/");

      const count =
        response.data.count ??
        response.data.wishlist?.length ??
        0;

      setWishlistCount(Number(count) || 0);
    } catch (error) {
      if (error.response?.status === 401) {
        setWishlistCount(0);
      } else {
        console.error("Unable to load wishlist count:", error);
      }
    }
  }, []);

  // SCROLL STATE
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // CLOSE MENUS WHEN PAGE CHANGES
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // CLOSE ACCOUNT MENU ON OUTSIDE CLICK / ESCAPE
  useEffect(() => {
    const onClick = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // LOCK BODY SCROLL ON MOBILE MENU
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // UPDATE CUSTOMER AUTHENTICATION
  useEffect(() => {
    const updateCustomer = () => {
      const customerName =
        localStorage.getItem("customer_username") || "";

      const token = localStorage.getItem("customer_access");

      setUsername(token ? customerName : "");

      if (!token || !customerName) {
        setCartCount(0);
        setWishlistCount(0);
        setAccountOpen(false);
      } else {
        setCartCount(
          Number(localStorage.getItem("customer_cart_count") || 0)
        );

        loadWishlistCount();
      }
    };

    window.addEventListener("customerAuthChanged", updateCustomer);
    window.addEventListener("storage", updateCustomer);

    updateCustomer();

    return () => {
      window.removeEventListener("customerAuthChanged", updateCustomer);
      window.removeEventListener("storage", updateCustomer);
    };
  }, [loadWishlistCount]);

  // WISHLIST COUNT CHANGES
  useEffect(() => {
    const updateWishlist = (event) => {
      if (event.detail?.count !== undefined) {
        setWishlistCount(Number(event.detail.count) || 0);
      } else {
        loadWishlistCount();
      }
    };

    window.addEventListener(
      "customerWishlistChanged",
      updateWishlist
    );

    return () => {
      window.removeEventListener(
        "customerWishlistChanged",
        updateWishlist
      );
    };
  }, [loadWishlistCount]);

  // CART COUNT CHANGES
  useEffect(() => {
    const updateCount = (event) => {
      const token = localStorage.getItem("customer_access");

      if (!token) {
        setCartCount(0);
        return;
      }

      if (event.detail?.count !== undefined) {
        setCartCount(Number(event.detail.count) || 0);
      } else {
        setCartCount(
          Number(localStorage.getItem("customer_cart_count") || 0)
        );
      }
    };

    window.addEventListener("customerCartChanged", updateCount);

    return () => {
      window.removeEventListener("customerCartChanged", updateCount);
    };
  }, []);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("customer_access");
    localStorage.removeItem("customer_refresh");
    localStorage.removeItem("customer_username");
    localStorage.removeItem("customer_email");
    localStorage.removeItem("customer_cart_count");

    setUsername("");
    setCartCount(0);
    setWishlistCount(0);

    closeMenu();

    window.dispatchEvent(new Event("customerAuthChanged"));

    window.dispatchEvent(
      new CustomEvent("customerCartChanged", {
        detail: { count: 0 },
      })
    );

    window.dispatchEvent(
      new CustomEvent("customerWishlistChanged", {
        detail: { count: 0 },
      })
    );

    navigate("/", { replace: true });
  };

  // NAVIGATION LINKS
  const navigationLinks = (
    <>
      <NavLink to="/" end onClick={closeMenu}>
        Home
      </NavLink>

      <NavLink to="/shop" onClick={closeMenu}>
        Collections
      </NavLink>

      <a href="/#story" onClick={closeMenu}>
        Our Story
      </a>

      <a href="/#craftsmanship" onClick={closeMenu}>
        Craftsmanship
      </a>

      <NavLink to="/contact" onClick={closeMenu}>
        Contact
      </NavLink>
    </>
  );

  return (
    <header
      className={[
        "sk-nav",
        overlay ? "is-overlay" : "is-solid",
        menuOpen ? "is-open" : "",
      ]
        .join(" ")
        .trim()}
    >
      <div className="sk-nav__inner">

        {/* BRAND */}
        <Link
          to="/"
          className="sk-nav__brand"
          onClick={closeMenu}
        >
          {storeLogo ? (
            <img
              src={storeLogo}
              alt={storeName}
              className="sk-nav__logo"
            />
          ) : (
            <span className="sk-nav__monogram">
              {storeName.charAt(0)}
            </span>
          )}

          <span className="sk-nav__name">
            {storeName}
            <small>The art of elegance</small>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav
          className="sk-nav__links"
          aria-label="Main navigation"
        >
          {navigationLinks}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="sk-nav__actions">

          {/* SEARCH */}
          <button
            type="button"
            className="sk-nav__icon"
            aria-label="Search sarees"
            title="Search"
            onClick={handleSearchClick}
          >
            <Search size={19} strokeWidth={1.5} />
          </button>

          {/* WISHLIST */}
          <Link
            to={isLoggedIn ? "/wishlist" : "/customer/login"}
            className="sk-nav__icon"
            aria-label={`Wishlist, ${wishlistCount} saved items`}
            title="Wishlist"
            onClick={closeMenu}
          >
            <Heart size={20} strokeWidth={1.5} />

            {isLoggedIn && wishlistCount > 0 && (
              <span className="sk-nav__badge">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* CUSTOMER ACCOUNT */}
          <div
            className="sk-nav__account"
            ref={accountRef}
          >
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="sk-nav__user"
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-expanded={accountOpen}
                  aria-label={`Customer account for ${username}`}
                  title={username}
                >
                  <UserRound
                    size={19}
                    strokeWidth={1.5}
                  />

                  {/* LOGGED-IN USERNAME */}
                  <span className="sk-nav__username">
                    {username}
                  </span>

                  <ChevronDown
                    size={14}
                    className={
                      accountOpen
                        ? "sk-nav__chev is-open"
                        : "sk-nav__chev"
                    }
                  />
                </button>

                {/* ACCOUNT DROPDOWN */}
                {accountOpen && (
                  <div className="sk-nav__dropdown">

                    <div className="sk-nav__welcome">
                      <span>Welcome back</span>
                      <strong>{username}</strong>
                    </div>

                    <Link
                      to="/profile"
                      onClick={closeMenu}
                    >
                      <UserRound size={16} />
                      My Profile
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={closeMenu}
                    >
                      <Package size={16} />
                      My Orders
                    </Link>

                    <Link
                      to="/my-returns"
                      onClick={closeMenu}
                    >
                      <RefreshCw size={16} />
                      My Returns
                    </Link>

                    <Link
                      to="/change-password"
                      onClick={closeMenu}
                    >
                      <LockKeyhole size={16} />
                      Change Password
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/customer/login"
                className="sk-nav__icon"
                aria-label="Customer login"
                title="Login"
                onClick={closeMenu}
              >
                <UserRound
                  size={19}
                  strokeWidth={1.5}
                />
              </Link>
            )}
          </div>

          {/* SHOPPING BAG */}
          <Link
            to="/cart"
            className="sk-nav__icon sk-nav__bag"
            aria-label={`Shopping bag, ${cartCount} items`}
            title="Shopping Bag"
            onClick={closeMenu}
          >
            <ShoppingBag
              size={21}
              strokeWidth={1.5}
            />

            {isLoggedIn && cartCount > 0 && (
              <span className="sk-nav__badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* MOBILE TOGGLE */}
          <button
            type="button"
            className="sk-nav__toggle"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setAccountOpen(false);
            }}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE FULL-SCREEN MENU */}
      <div
        className={`sk-nav__panel${menuOpen ? " is-open" : ""}`}
      >
        <nav
          className="sk-nav__panel-links"
          aria-label="Mobile navigation"
        >
          {navigationLinks}
        </nav>

        <div className="sk-nav__panel-foot">

          <button
            type="button"
            className="sk-nav__panel-btn"
            onClick={handleSearchClick}
          >
            <Search size={17} />
            Search Sarees
          </button>

          {isLoggedIn ? (
            <>
              {/* MOBILE USERNAME */}
              <div className="sk-nav__panel-user">
                <UserRound size={19} />

                <span>
                  Welcome, <strong>{username}</strong>
                </span>
              </div>

              <div className="sk-nav__panel-account">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                >
                  My Profile
                </Link>

                <Link
                  to="/my-orders"
                  onClick={closeMenu}
                >
                  My Orders
                </Link>

                <Link
                  to="/my-returns"
                  onClick={closeMenu}
                >
                  My Returns
                </Link>

                <Link
                  to="/change-password"
                  onClick={closeMenu}
                >
                  Change Password
                </Link>
              </div>

              <button
                type="button"
                className="sk-nav__panel-btn sk-nav__panel-btn--out"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/customer/login"
              className="sk-nav__panel-btn"
              onClick={closeMenu}
            >
              <UserRound size={17} />
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
