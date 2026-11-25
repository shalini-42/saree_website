
import { useEffect, useRef, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  BarChart3,
  UserCog,
  LogOut,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  Star,
  Settings,
  ShieldCheck,
  Sparkles,
  MessageSquare,
} from "lucide-react";

import "./AdminNavbar.css";

function AdminNavbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profileRef = useRef(null);

  const username = localStorage.getItem("username") || "Admin";
  const initial = username.trim().charAt(0).toUpperCase() || "A";

  // ADMIN NAVIGATION
  const navigation = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: Package,
    },
    {
      name: "Categories",
      path: "/admin/categories",
      icon: Tags,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      name: "Returns",
      path: "/admin/return-exchanges",
      icon: RefreshCw,
    },
    {
      name: "Reviews",
      path: "/admin/reviews",
      icon: Star,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: UserCog,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: Users,
    },
    {
      name: "Contact Messages",
      path: "/admin/contact-messages",
      icon: MessageSquare,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    navigate("/login", { replace: true });
  };

  // SCROLL EFFECT
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 6);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // CLOSE PROFILE MENU
  useEffect(() => {
    const onClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
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

  // BODY SCROLL CONTROL
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const linkClass = ({ isActive }) =>
    `sn-link${isActive ? " is-active" : ""}`;

  const drawerLinkClass = ({ isActive }) =>
    `sn-drawer__link${isActive ? " is-active" : ""}`;

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header className={`sn-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="sn-bar">

          {/* BRAND */}

          <button
            type="button"
            className="sn-brand"
            onClick={() => navigate("/admin/dashboard")}
            aria-label="SĀRIKA admin home"
          >
            <span className="sn-brand__mark">
              <span className="sn-brand__mark-inner">S</span>
            </span>

            <span className="sn-brand__text">
              <span className="sn-brand__name">SĀRIKA</span>
              <span className="sn-brand__tag">
                LUXURY BOUTIQUE
              </span>
            </span>
          </button>

          {/* DESKTOP NAVIGATION */}

          <nav className="sn-nav" aria-label="Admin navigation">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin/dashboard"}
                  className={linkClass}
                  title={item.name}
                >
                  <Icon size={15} strokeWidth={1.7} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* PROFILE */}

          <div className="sn-profile" ref={profileRef}>
            <button
              type="button"
              className={`sn-profile__btn${profileOpen ? " is-open" : ""}`}
              onClick={() => setProfileOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <span className="sn-avatar">{initial}</span>

              <span className="sn-profile__who">
                <span className="sn-profile__hello">
                  WELCOME BACK
                </span>

                <span className="sn-profile__name">
                  {username}
                </span>
              </span>

              <ChevronDown
                size={15}
                className={`sn-profile__chev${profileOpen ? " is-open" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="sn-menu" role="menu">
                <div className="sn-menu__head">
                  <span className="sn-avatar sn-avatar--lg">
                    {initial}
                  </span>

                  <div className="sn-menu__identity">
                    <p className="sn-menu__name">{username}</p>

                    <p className="sn-menu__role">
                      <ShieldCheck size={13} />
                      Administrator
                    </p>
                  </div>
                </div>

                <div className="sn-menu__divider" />

                <button
                  type="button"
                  role="menuitem"
                  className="sn-menu__settings"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/admin/settings");
                  }}
                >
                  <Settings size={16} />
                  Account settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="sn-menu__logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Log out
                </button>

                <div className="sn-menu__footer">
                  SĀRIKA · ADMIN PORTAL
                </div>
              </div>
            )}
          </div>

          {/* MOBILE TOGGLE */}

          <button
            type="button"
            className="sn-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={23} />
          </button>
        </div>

        {/* GOLD DECORATIVE LINE */}

        <div className="sn-zari">
          <span />
        </div>
      </header>

      {/* MOBILE BACKDROP */}

      <div
        className={`sn-backdrop${menuOpen ? " is-open" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* MOBILE DRAWER */}

      <aside
        className={`sn-drawer${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="sn-drawer__top">
          <div className="sn-drawer__brand">
            <span className="sn-brand__mark">
              <span className="sn-brand__mark-inner">S</span>
            </span>

            <div>
              <p className="sn-brand__name">SĀRIKA</p>
              <p className="sn-brand__tag">ADMIN PORTAL</p>
            </div>
          </div>

          <button
            type="button"
            className="sn-drawer__close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
            tabIndex={menuOpen ? 0 : -1}
          >
            <X size={21} />
          </button>
        </div>

        <div className="sn-drawer__welcome">
          <span className="sn-avatar sn-avatar--lg">{initial}</span>

          <div>
            <p className="sn-menu__name">{username}</p>
            <p className="sn-menu__role">
              <ShieldCheck size={13} />
              Administrator
            </p>
          </div>
        </div>

        <div className="sn-drawer__label">
          MANAGEMENT
        </div>

        <nav
          className="sn-drawer__nav"
          aria-label="Mobile admin navigation"
        >
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin/dashboard"}
                onClick={closeMobileMenu}
                className={drawerLinkClass}
                tabIndex={menuOpen ? 0 : -1}
              >
                <span className="sn-drawer__icon">
                  <Icon size={18} strokeWidth={1.7} />
                </span>

                <span>{item.name}</span>

                <span className="sn-drawer__arrow">›</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sn-drawer__bottom">
          <div className="sn-drawer__signature">
            <Sparkles size={14} />
            <span>Elegance in every detail</span>
          </div>

          <button
            type="button"
            className="sn-drawer__logout"
            onClick={handleLogout}
            tabIndex={menuOpen ? 0 : -1}
          >
            <LogOut size={18} />
            Log out
          </button>

          <p className="sn-drawer__copyright">
            © SĀRIKA LUXURY BOUTIQUE
          </p>
        </div>
      </aside>
    </>
  );
}

export default AdminNavbar;
