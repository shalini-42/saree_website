import { useCallback, useEffect, useState } from "react";
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  XCircle,
  RefreshCw,
  TrendingUp,
  Package,
  Layers,
} from "lucide-react";
import api from "../../services/api";
import "./AdminAnalytics.css";

// Helper to safely convert arrays or object dictionaries into a standardized array
const normalizeStatusList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((item) => ({
      status: item.status || item.name || item.label || "Unknown",
      count: Number(item.count || item.total || item.value || 0),
    }));
  }
  if (typeof data === "object") {
    return Object.entries(data).map(([key, val]) => ({
      status: key,
      count:
        typeof val === "object" && val !== null
          ? Number(val.count || val.total || 0)
          : Number(val || 0),
    }));
  }
  return [];
};

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") return Object.values(data);
  return [];
};

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("admin/analytics/");
      setAnalytics(response.data);
    } catch (err) {
      console.error("Analytics error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load analytics. Please check your admin login."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const statistics = analytics?.statistics || {};

  const cards = [
    {
      title: "Total Revenue",
      value: money(statistics.total_revenue),
      icon: IndianRupee,
      description: "Net revenue from paid orders",
      isRevenue: true,
      delay: "0.05s",
    },
    {
      title: "Total Orders",
      value: statistics.total_orders || 0,
      icon: ShoppingBag,
      description: "All customer purchases",
      delay: "0.15s",
    },
    {
      title: "Pending Orders",
      value: statistics.pending_orders || 0,
      icon: Clock,
      description: "Orders awaiting dispatch",
      delay: "0.25s",
    },
    {
      title: "Cancelled Orders",
      value: statistics.cancelled_orders || 0,
      icon: XCircle,
      description: "Returned or cancelled orders",
      delay: "0.35s",
    },
  ];

  if (loading && !analytics) {
    return (
      <div className="sarika-admin-analytics">
        <div className="sarika-loading-screen">
          <div className="sarika-royal-spinner" />
          <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--primary)", margin: "0 0 6px" }}>
            Gathering SĀRIKA Intelligence...
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Syncing royal saree revenue & collection performance
          </p>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="sarika-admin-analytics">
        <div className="sarika-error-screen">
          <div className="sarika-error-card">
            <div style={{ fontSize: "36px", color: "var(--danger)", marginBottom: "12px" }}>✕</div>
            <h3 style={{ fontFamily: "Playfair Display, serif", color: "var(--primary)", margin: "0 0 8px" }}>
              Analytics Unavailable
            </h3>
            <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "0 0 24px" }}>{error}</p>
            <button
              onClick={fetchAnalytics}
              className="sarika-btn-refresh"
              style={{ margin: "0 auto" }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe normalized datasets
  const monthlySales = normalizeList(analytics?.monthly_sales);
  const maxRevenue = Math.max(
    ...monthlySales.map((item) => Number(item?.revenue || item?.total || 0)),
    1
  );

  const orderStatuses = normalizeStatusList(analytics?.order_status);
  const paymentStatuses = normalizeStatusList(analytics?.payment_status);
  const bestSellers = normalizeList(analytics?.best_sellers);
  const categorySales = normalizeList(analytics?.category_sales);

  const totalPaymentCount = paymentStatuses.reduce(
    (sum, row) => sum + Number(row.count || 0),
    0
  );

  return (
    <div className="sarika-admin-analytics">
      <div className="sarika-container">
        {/* Royal Accent Strip */}
        <div className="sarika-accent-strip" />

        {/* Header */}
        <header className="sarika-header">
          <div>
            <span className="sarika-subtitle-chip">❖ Executive Intelligence Hub</span>
            <h1 className="sarika-title">
              SĀRIKA <span className="sarika-title-slash">/</span> Sales Analytics
            </h1>
            <p className="sarika-tagline">
              Real-time revenue performance, order distribution, and collection popularity.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="sarika-btn-refresh"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh Feed"}</span>
          </button>
        </header>

        {/* 4 Hero Metric Cards */}
        <div className="sarika-stats-grid">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="sarika-stat-card"
                style={{ animationDelay: card.delay }}
              >
                <div className="sarika-stat-top">
                  <span className="sarika-stat-label">{card.title}</span>
                  <div className="sarika-stat-icon-wrap">
                    <Icon size={20} />
                  </div>
                </div>

                <div
                  className={`sarika-stat-value ${card.isRevenue ? "revenue" : ""}`}
                >
                  {card.value}
                </div>

                <p className="sarika-stat-desc">{card.description}</p>
              </div>
            );
          })}
        </div>

        {/* Monthly Revenue Chart */}
        <section className="sarika-panel sarika-chart-section">
          <div className="sarika-panel-header">
            <div className="sarika-panel-icon">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="sarika-panel-title">Bespoke Monthly Revenue</h2>
              <p className="sarika-panel-subtitle">
                Completed purchase value across the last six billing months
              </p>
            </div>
          </div>

          {monthlySales.length === 0 ? (
            <div className="sarika-empty-state">
              No monthly sales volume recorded in this cycle.
            </div>
          ) : (
            <div className="sarika-chart-wrap">
              {monthlySales.map((item, idx) => {
                const revenue = Number(item.revenue || item.total || 0);
                const heightPercent = Math.max(
                  (revenue / maxRevenue) * 100,
                  revenue > 0 ? 6 : 2
                );

                return (
                  <div key={item.month || item.label || idx} className="sarika-chart-col">
                    {/* Hover Floating Tooltip */}
                    <div className="sarika-bar-tooltip">
                      {money(revenue)}
                    </div>

                    {/* Animated Pillar Bar */}
                    <div
                      className="sarika-bar-pill"
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.label || item.month}: ${money(revenue)}`}
                    />

                    {/* Month Label */}
                    <span className="sarika-chart-month">
                      {item.label || item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Dual Grid: Order Status & Payment Status */}
        <div className="sarika-dual-grid">
          {/* Order Status */}
          <div className="sarika-panel">
            <div className="sarika-panel-header">
              <div className="sarika-panel-icon">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="sarika-panel-title">Order Status Distribution</h2>
                <p className="sarika-panel-subtitle">Lifecycle stages of incoming orders</p>
              </div>
            </div>

            <div>
              {orderStatuses.length === 0 ? (
                <div className="sarika-empty-state">No status records available.</div>
              ) : (
                orderStatuses.map((item) => {
                  const total = Number(statistics.total_orders || 0);
                  const percentage = total
                    ? Math.round((item.count / total) * 100)
                    : 0;

                  return (
                    <div key={item.status} className="sarika-progress-row">
                      <div className="sarika-progress-labels">
                        <span className="sarika-progress-title">{item.status}</span>
                        <span className="sarika-progress-count">
                          {item.count}{" "}
                          <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                            ({percentage}%)
                          </small>
                        </span>
                      </div>
                      <div className="sarika-progress-track">
                        <div
                          className="sarika-progress-bar order"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div className="sarika-panel">
            <div className="sarika-panel-header">
              <div className="sarika-panel-icon">
                <IndianRupee size={20} />
              </div>
              <div>
                <h2 className="sarika-panel-title">Payment Settlement Flow</h2>
                <p className="sarika-panel-subtitle">Transaction status breakdown</p>
              </div>
            </div>

            <div>
              {paymentStatuses.length === 0 ? (
                <div className="sarika-empty-state">No payment records available.</div>
              ) : (
                paymentStatuses.map((item) => {
                  const percentage = totalPaymentCount
                    ? Math.round((item.count / totalPaymentCount) * 100)
                    : 0;

                  return (
                    <div key={item.status} className="sarika-progress-row">
                      <div className="sarika-progress-labels">
                        <span className="sarika-progress-title">{item.status}</span>
                        <span className="sarika-progress-count">
                          {item.count}{" "}
                          <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                            ({percentage}%)
                          </small>
                        </span>
                      </div>
                      <div className="sarika-progress-track">
                        <div
                          className="sarika-progress-bar payment"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Dual Grid: Best Sellers & Categories */}
        <div className="sarika-dual-grid">
          {/* Best Selling Sarees */}
          <div className="sarika-panel">
            <div className="sarika-panel-header">
              <div className="sarika-panel-icon">
                <Package size={20} />
              </div>
              <div>
                <h2 className="sarika-panel-title">Best-Selling Sarees</h2>
                <p className="sarika-panel-subtitle">Top-performing heirloom pieces</p>
              </div>
            </div>

            {bestSellers.length === 0 ? (
              <div className="sarika-empty-state">No product sales logged yet.</div>
            ) : (
              <div>
                {bestSellers.map((item, index) => (
                  <div key={item.product_id || index} className="sarika-rank-row">
                    <div className="sarika-rank-left">
                      <span
                        className={`sarika-rank-badge ${index === 0 ? "top-one" : ""}`}
                      >
                        {index + 1}
                      </span>
                      <span className="sarika-rank-name">{item.product_name}</span>
                    </div>

                    <span className="sarika-rank-score">
                      {item.total_sold} units sold
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Saree Categories */}
          <div className="sarika-panel">
            <div className="sarika-panel-header">
              <div className="sarika-panel-icon">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="sarika-panel-title">Leading Saree Categories</h2>
                <p className="sarika-panel-subtitle">Highest grossing weave types & silhouettes</p>
              </div>
            </div>

            {categorySales.length === 0 ? (
              <div className="sarika-empty-state">No category activity recorded yet.</div>
            ) : (
              <div>
                {categorySales.map((item, index) => (
                  <div
                    key={item.product__category__name || index}
                    className="sarika-rank-row"
                  >
                    <div className="sarika-rank-left">
                      <span
                        className={`sarika-rank-badge ${index === 0 ? "top-one" : ""}`}
                      >
                        {index + 1}
                      </span>
                      <span className="sarika-rank-name">
                        {item.product__category__name || item.name || "Uncategorized"}
                      </span>
                    </div>

                    <span className="sarika-rank-score">
                      {item.total_sold} units sold
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="sarika-footer-note">
          ❖ SĀRIKA LUXURY ATELIER · REVENUE & REPERTOIRE INTELLIGENCE ❖
        </p>
      </div>
    </div>
  );
}

export default AdminAnalytics;
