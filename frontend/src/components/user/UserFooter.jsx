
import React from "react";
import { Link } from "react-router-dom";
import useStoreSettings from "../../hooks/useStoreSettings";
import "./UserFooter.css";

function UserFooter() {
  const { settings, loading } = useStoreSettings();

  const storeName = settings?.store_name || "SĀRIKA";
  const storeLogo = settings?.store_logo || "";
  const storeEmail = settings?.store_email || "hello@sarika.com";
  const storePhone = settings?.store_phone || "";
  const storeAddress = settings?.store_address || "";
  const tagline =
    settings?.tagline || "Timeless elegance, woven with tradition.";

  return (
    <footer className="user-footer">
      <div className="footer-container">

        {/* BRAND SECTION */}
        <div className="footer-brand">

          <Link to="/" className="footer-logo">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="footer-dynamic-logo"
              />
            ) : (
              <>
                {storeName}<span>.</span>
              </>
            )}
          </Link>

          <p>
            {loading
              ? "Discover timeless elegance and traditional craftsmanship."
              : tagline}
            {" "}
            Discover sarees that celebrate every beautiful moment.
          </p>

          <div className="footer-socials">

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              ◎
            </a>

            <a
              href={`mailto:${storeEmail}`}
              aria-label="Email"
            >
              ✉
            </a>

            <Link to="/contact" aria-label="Contact">
              ↗
            </Link>

          </div>

          {/* STORE CONTACT DETAILS */}
          <div className="footer-contact-details">

            {storePhone && (
              <p>
                <strong>Phone:</strong>{" "}
                <a href={`tel:${storePhone}`}>
                  {storePhone}
                </a>
              </p>
            )}

            {storeEmail && (
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${storeEmail}`}>
                  {storeEmail}
                </a>
              </p>
            )}

            {storeAddress && (
              <p>
                <strong>Address:</strong> {storeAddress}
              </p>
            )}

          </div>

        </div>

        {/* EXPLORE */}
        <div className="footer-column">
          <h4>EXPLORE</h4>

          <Link to="/">Home</Link>
          <Link to="/shop">Our Collection</Link>
          <Link to="/#story">Our Story</Link>
          <Link to="/#craftsmanship">Craftsmanship</Link>
        </div>

        {/* CUSTOMER CARE */}
        <div className="footer-column">
          <h4>CUSTOMER CARE</h4>

          <Link to="/contact">Contact Us</Link>
          <Link to="/my-orders">My Orders</Link>
          <Link to="/profile">My Account</Link>
          <Link to="/cart">Shopping Bag</Link>
        </div>

        {/* JOURNAL */}
        <div className="footer-newsletter">
          <h4>THE {storeName} JOURNAL</h4>

          <p>
            Discover new collections, timeless stories and
            exclusive updates.
          </p>

          <Link to="/shop" className="footer-explore-link">
            Explore Collection <span>↗</span>
          </Link>
        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </p>

        <p>Crafted with elegance and tradition.</p>
      </div>

    </footer>
  );
}

export default UserFooter;
